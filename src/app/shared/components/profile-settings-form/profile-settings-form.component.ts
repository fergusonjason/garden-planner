import { Component, inject, input, output, signal, computed } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { ErrorMessageService } from '@core/services/error-message.service';
import { UserService } from '@core/services/user.service';
import { UiService } from '@core/services/ui.service';
import { UserPreferencesSchema } from '@shared/models/user-preferences';
import { UserProfileBuilder } from '@shared/models/user-profile.builder';
import { TypeaheadComponent, type TypeaheadItem } from '@shared/components/typeahead/typeahead.component';

const ALLOWED_UNITS: ReadonlyArray<'feet' | 'meters'> = ['feet', 'meters'];

function unitsValidator(control: AbstractControl): ValidationErrors | null {
  return ALLOWED_UNITS.includes(control.value) ? null : { invalidUnits: true };
}

@Component({
  selector: 'gp-profile-settings-form',
  standalone: true,
  imports: [ReactiveFormsModule, TypeaheadComponent],
  templateUrl: './profile-settings-form.component.html',
  styleUrl: './profile-settings-form.component.css'
})
export class ProfileSettingsFormComponent {

  private readonly userService = inject(UserService);
  private readonly errorMessageService = inject(ErrorMessageService);
  private readonly fb = inject(FormBuilder);
  private readonly uiService = inject(UiService);

  readonly submitLabel = input<string>('Save');
  readonly showSubmitButton = input<boolean>(true);
  readonly saved = output<void>();

  readonly countries = this.uiService.countries;

  isLoading = signal(false);
  errorMessages = this.errorMessageService.errorMessages;

  private readonly profile = this.userService.profile;
  private readonly prefs = this.profile?.preferences;

  form = this.fb.group({
    display_name: [this.profile?.display_name ?? '', Validators.required],
    preferred_units: [(this.prefs?.preferred_units ?? 'feet') as 'feet' | 'meters', [Validators.required, unitsValidator]],
    grid_size: this.fb.group({
      width: [this.prefs?.grid_size?.width ?? 20, [Validators.required, Validators.min(1), Validators.max(500)]],
      height: [this.prefs?.grid_size?.height ?? 20, [Validators.required, Validators.min(1), Validators.max(500)]]
    }),
    temperature_scale: [(this.prefs?.temperature_scale ?? 'fahrenheit') as 'fahrenheit' | 'celsius'],
    country: [this.prefs?.country ?? 'US'],
    show_quick_tips: [this.prefs?.show_quick_tips ?? true],
    growing_zone: [this.prefs?.growing_zone ?? null]
  });

  private readonly selectedCountry = toSignal(this.form.controls.country.valueChanges, {
    initialValue: this.form.controls.country.value
  });

  readonly isUS = computed(() => this.selectedCountry() === 'US');

  constructor() {
    const growingZone = this.form.controls.growing_zone;

    if (this.form.controls.country.value !== 'US') {
      growingZone.disable();
    }

    this.form.controls.country.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(country => {
        if (country === 'US') {
          growingZone.enable();
        } else {
          growingZone.setValue(null);
          growingZone.disable();
        }
      });
  }

  readonly zoneDataFn = (query: string): TypeaheadItem[] =>
    this.uiService.growingZones()
      .filter(r => r.zipcode.startsWith(query))
      .slice(0, 8)
      .map(r => {
        const location = r.city && r.state ? `${r.city}, ${r.state}` : r.zipcode;
        const range = r.trange ?? r.zonetitle;
        return { name: `${r.zone} — ${location} — ${range}`, value: r.zone };
      });

  onZoneSelected(item: TypeaheadItem): void {
    this.form.controls.growing_zone.setValue(item.value);
  }

  async save(): Promise<void> {
    await this.onSubmit();
  }

  async onSubmit(): Promise<void> {
    if (!this.form.valid) return;

    this.errorMessageService.clearErrors();

    try {
      this.isLoading.set(true);
      const formValue = this.form.getRawValue();
      const preferences = UserPreferencesSchema.parse(formValue);
      const updatedProfile = UserProfileBuilder.from(this.profile!)
        .displayName(formValue.display_name)
        .preferences(preferences)
        .build();
      await this.userService.upsertProfile(updatedProfile);
      this.saved.emit();
    } catch (error) {
      this.errorMessageService.addError('Failed to save: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      this.isLoading.set(false);
    }
  }
}