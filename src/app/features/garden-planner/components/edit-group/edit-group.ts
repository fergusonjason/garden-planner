import { Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { PLANT_MAP } from 'src/app/shared/constants/plant-map-constants';

export interface EditGroupData {
  plant?:   string;
  subtype?: string;
  notes?:   string;
}

@Component({
  selector: 'edit-group',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" class="edit-group-form">
      <div class="edit-group-field">
        <label class="edit-group-label">Plant</label>
        <select formControlName="plant" class="edit-group-input">
          @for (key of plantKeys; track key) {
            <option [value]="key">{{ key.charAt(0).toUpperCase() + key.slice(1) }}</option>
          }
        </select>
      </div>
      <div class="edit-group-field">
        <label class="edit-group-label">Subtype</label>
        <input formControlName="subtype"
               type="text"
               class="edit-group-input"
               placeholder="e.g. Cherry, Roma…" />
      </div>
      <div class="edit-group-field">
        <label class="edit-group-label">Notes</label>
        <textarea formControlName="notes"
                  class="edit-group-input"
                  rows="4"
                  placeholder="Any notes about this group…"></textarea>
      </div>
    </form>
  `,
})
export class EditGroupComponent implements OnInit {
  plant    = input<string>('');
  subtype  = input<string>('');
  notes    = input<string>('');
  onChange = input<(data: EditGroupData) => void>(() => {});

  readonly plantKeys = Object.keys(PLANT_MAP);

  private fb         = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  form = this.fb.group({
    plant:   [''],
    subtype: [''],
    notes:   [''],
  });

  ngOnInit(): void {
    this.form.setValue({
      plant:   this.plant()   ?? '',
      subtype: this.subtype() ?? '',
      notes:   this.notes()   ?? '',
    });
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => {
        this.onChange()({
          plant:   v.plant   || undefined,
          subtype: v.subtype?.trim() || undefined,
          notes:   v.notes?.trim()   || undefined,
        });
      });
  }
}
