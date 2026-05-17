import { Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

export interface EditGroupData {
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
  subtype  = input<string>('');
  notes    = input<string>('');
  onChange = input<(data: EditGroupData) => void>(() => {});

  private fb         = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  form = this.fb.group({
    subtype: [''],
    notes:   [''],
  });

  ngOnInit(): void {
    this.form.setValue({ subtype: this.subtype() ?? '', notes: this.notes() ?? '' });
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => {
        this.onChange()({
          subtype: v.subtype?.trim() || undefined,
          notes:   v.notes?.trim()   || undefined,
        });
      });
  }
}
