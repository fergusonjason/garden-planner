import { Component, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ErrorMessageService } from '@core/services/error-message.service';
import { UserService } from '@core/services/user.service';
import { UserPreferencesSchema } from '@shared/models/user-preferences';
import { UserProfileBuilder } from '@shared/models/user-profile.builder';

const ALLOWED_UNITS: ReadonlyArray<'feet' | 'meters'> = ['feet', 'meters'];

function unitsValidator(control: AbstractControl): ValidationErrors | null {
  return ALLOWED_UNITS.includes(control.value) ? null : { invalidUnits: true };
}

@Component({
  selector: 'gp-profile-settings-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profile-settings-form.component.html',
  styleUrl: './profile-settings-form.component.css'
})
export class ProfileSettingsFormComponent {

  private readonly userService = inject(UserService);
  private readonly errorMessageService = inject(ErrorMessageService);
  private readonly fb = inject(FormBuilder);

  readonly submitLabel = input<string>('Save');
  readonly showSubmitButton = input<boolean>(true);
  readonly saved = output<void>();

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
    show_quick_tips: [this.prefs?.show_quick_tips ?? true]
  });

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