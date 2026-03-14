import { CommonModule } from '@angular/common';
import { Component, inject, input, model, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'garden-planner-dimension-bar',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './dimension-bar.html',
  styleUrl: './dimension-bar.css',
})
export class DimensionBar {

  private formBuilder = inject(FormBuilder)

  colsInput = input<number>();
  rowsInput = input<number>();

  // TODO: these really need to be configured elsewhere
  readonly minimumColumnCount = 5;
  readonly maximumColumnCount = 200;
  readonly minimumRowCount = 5;
  readonly maximumRowCount = 200;

  dimensionChange = output<{ cols: number, rows: number }>();

  dimWarning = signal(false);

  dimensionsFormGroup = this.formBuilder.group({
    cols: [40, [Validators.required, Validators.min(this.minimumColumnCount), Validators.max(this.maximumColumnCount)]],
    rows: [25, [Validators.required, Validators.min(this.minimumRowCount), Validators.max(this.maximumRowCount)]],
  });

  applyDimensions(): void {
    // TODO: change the 40x25 to something more generic
    const cols = Math.min(200, Math.max(this.minimumColumnCount, this.colsInput() || 40));
    const rows = Math.min(200, Math.max(this.maximumColumnCount, this.rowsInput() || 25));
    this.dimensionChange.emit({ cols, rows });
  }

  doApplyDimensions(): void {
    if (this.dimensionsFormGroup.valid) {
      const { cols, rows } = this.dimensionsFormGroup.value;
      this.dimensionChange.emit({ cols: cols!, rows: rows! });
    }
  }
}
