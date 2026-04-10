import { Component, inject, output, signal } from '@angular/core';
import { ControlContainer, FormGroup, ReactiveFormsModule } from '@angular/forms';

export interface DimensionBarValue {
  cols: number;
  rows: number;
}

@Component({
  selector: 'garden-planner-dimension-bar',
  imports: [ReactiveFormsModule],
  templateUrl: './dimension-bar.html',
  styleUrl: './dimension-bar.css',
})
export class DimensionBar {

  private controlContainer = inject(ControlContainer);

  dimensionChange = output<DimensionBarValue>();

  dimWarning = signal(false);

  get dimensionsGroup(): FormGroup {
    return this.controlContainer.control as FormGroup;
  }

  // ─── Actions ────────────────────────────────────────────────────────────────
  doApplyDimensions(): void {
    const form = this.dimensionsGroup;
    if (form?.valid) {
      const { cols, rows } = form.value;
      this.dimensionChange.emit({ cols: cols!, rows: rows! });
    }
  }
}
