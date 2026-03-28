import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

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

  dimensionsFormGroup = input.required<FormGroup>();

  dimensionChange = output<{ cols: number, rows: number }>();

  dimWarning = signal(false);

  doApplyDimensions(): void {
    if (this.dimensionsFormGroup().valid) {
      const { cols, rows } = this.dimensionsFormGroup().value;
      this.dimensionChange.emit({ cols: cols!, rows: rows! });
    }
  }
}
