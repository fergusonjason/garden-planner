import { Component, forwardRef, inject, output, signal } from '@angular/core';
import { ControlValueAccessor, FormBuilder, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from '@angular/forms';

export interface DimensionBarValue {
  cols: number;
  rows: number;
}

@Component({
  selector: 'garden-planner-dimension-bar',
  imports: [ReactiveFormsModule],
  templateUrl: './dimension-bar.html',
  styleUrl: './dimension-bar.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DimensionBar),
      multi: true,
    }
  ]
})
export class DimensionBar implements ControlValueAccessor {

  private formBuilder = inject(FormBuilder);

  dimensionChange = output<DimensionBarValue>();

  dimWarning = signal(false);

  dimensionsFormGroup: FormGroup = this.formBuilder.group({
    cols: [40, [Validators.required, Validators.min(5), Validators.max(200)]],
    rows: [40, [Validators.required, Validators.min(5), Validators.max(200)]],
  });

  private onChange: (value: DimensionBarValue) => void = () => {};
  private onTouched: () => void = () => {};

  // ─── ControlValueAccessor ───────────────────────────────────────────────────
  writeValue(value: DimensionBarValue | null): void {
    if (value) {
      this.dimensionsFormGroup.setValue({ cols: value.cols, rows: value.rows }, { emitEvent: false });
    }
  }

  registerOnChange(fn: (value: DimensionBarValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.dimensionsFormGroup.disable() : this.dimensionsFormGroup.enable();
  }

  // ─── Actions ────────────────────────────────────────────────────────────────
  doApplyDimensions(): void {
    if (this.dimensionsFormGroup.valid) {
      const { cols, rows } = this.dimensionsFormGroup.value;
      const value: DimensionBarValue = { cols: cols!, rows: rows! };
      this.onTouched();
      this.onChange(value);
      this.dimensionChange.emit(value);
    }
  }
}
