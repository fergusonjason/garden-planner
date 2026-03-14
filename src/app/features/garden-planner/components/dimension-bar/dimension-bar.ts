import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, input, model, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'garden-planner-dimension-bar',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './dimension-bar.html',
  styleUrl: './dimension-bar.css',
})
export class DimensionBar implements AfterViewInit{

  private formBuilder = inject(FormBuilder)

  initialCols = input.required<number>();
  initialRows = input.required<number>();

  // TODO: these really need to be configured elsewhere
  readonly minimumColumnCount = 5;
  readonly maximumColumnCount = 200;
  readonly minimumRowCount = 5;
  readonly maximumRowCount = 200;

  dimensionChange = output<{ cols: number, rows: number }>();

  dimWarning = signal(false);

  dimensionsFormGroup!: FormGroup;

  ngAfterViewInit(): void {

    this.dimensionsFormGroup = this.formBuilder.group({
      cols: [this.initialCols(), [Validators.required, Validators.min(this.minimumColumnCount), Validators.max(this.maximumColumnCount)]],
      rows: [this.initialRows(), [Validators.required, Validators.min(this.minimumRowCount), Validators.max(this.maximumRowCount)]],
    });
  }

  applyDimensions(): void {
    const cols = Math.min(this.maximumColumnCount, Math.max(this.minimumColumnCount, this.initialCols()));
    const rows = Math.min(this.maximumRowCount, Math.max(this.minimumRowCount, this.initialRows()));
    this.dimensionChange.emit({ cols, rows });
  }

  doApplyDimensions(): void {
    if (this.dimensionsFormGroup.valid) {
      const { cols, rows } = this.dimensionsFormGroup.value;
      this.dimensionChange.emit({ cols: cols!, rows: rows! });
    }
  }
}
