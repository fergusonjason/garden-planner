import { Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'edit-plan-notes',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" class="edit-group-form">
      <div class="edit-group-field">
        <textarea formControlName="notes"
                  class="edit-group-input"
                  rows="6"
                  placeholder="Notes about this garden plan…"></textarea>
      </div>
    </form>
  `,
})
export class EditPlanNotesComponent implements OnInit {
  notes    = input<string>('');
  onChange = input<(notes: string) => void>(() => {});

  private fb         = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  form = this.fb.group({ notes: [''] });

  ngOnInit(): void {
    this.form.setValue({ notes: this.notes() ?? '' });
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(v => this.onChange()(v.notes ?? ''));
  }
}
