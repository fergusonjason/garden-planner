import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

import { APPLICATION_VERSION } from 'src/app/core/tokens/application-version.token';
import { PLANT_MAP } from 'src/app/shared/constants/plant-map-constants';
import { SelectedPlant } from 'src/app/shared/models/selected-plant';
import { DialogService } from 'src/app/shared/services/dialog-service';
import { DimensionBar } from '../dimension-bar/dimension-bar';
import { buildGardenXML, GardenGrid, GardenGridValue, parseGardenXML } from '../garden-grid/garden-grid';
import { PlantingSelector } from '../planting-selector/planting-selector';
import { PlantingToolbar } from '../planting-toolbar/planting-toolbar';
import { InstructionsComponent } from '../instructions-component/instructions.component';

@Component({
  selector: 'garden-planner-main',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DimensionBar,
    GardenGrid,
    PlantingSelector,
    PlantingToolbar,
  ],
  templateUrl: './garden-planner-main.html',
  styleUrl: './garden-planner-main.css',
})
export class GardenPlannerMain {

  private dialogService = inject(DialogService);
  private formBuilder = inject(FormBuilder);

  applicationVersion = inject(APPLICATION_VERSION);

  readonly defaultCols = 40;
  readonly defaultRows = 40;

  dimensionsFormGroup = this.formBuilder.group({
    cols: [this.defaultCols, [Validators.required, Validators.min(5), Validators.max(200)]],
    rows: [this.defaultRows, [Validators.required, Validators.min(5), Validators.max(200)]],
  });

  gardenGridControl = new FormControl<GardenGridValue>(
    { cols: this.defaultCols, rows: this.defaultRows, cells: [] },
    { nonNullable: true },
  );

  // ─── Grid dimensions ────────────────────────────────────────────────────────
  cols = signal<number>(this.defaultCols);
  rows = signal<number>(this.defaultRows);

  subtitle = computed<string>(() => {
    const cols = this.cols();
    const rows = this.rows();
    const sqFt = cols * rows;
    return `${cols} ft × ${rows} ft · ${sqFt} sq ft · 1 cell = 1 sq ft`;
  });

  // ─── Paint state ────────────────────────────────────────────────────────────
  selectedPlant = signal<SelectedPlant>({ plant: { key: 'tomato', ...PLANT_MAP['tomato'] }, currentZone: null });

  paintedCount = signal<number>(0);

  // ─── Modal ──────────────────────────────────────────────────────────────────
  plantSelectorDialogOpen = signal<boolean>(false);

  // ─── Listeners ───────────────────────────────────────────────────────────────
  private keydownListener = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.closeModal();
  };

  // ─── Lifecycle ───────────────────────────────────────────────────────────────
  ngAfterViewInit(): void {
    document.addEventListener('keydown', this.keydownListener);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.keydownListener);
  }

  // ─── Dimensions ─────────────────────────────────────────────────────────────
  applyDimensions(e: { cols: number, rows: number }): void {
    this.cols.set(e.cols);
    this.rows.set(e.rows);
    this.gardenGridControl.setValue({ cols: e.cols, rows: e.rows, cells: [] });
  }

  doOpenInstructions(): void {
    this.dialogService.createDialog()
      .setTitle('Garden Planner Instructions')
      .setDialogContent(InstructionsComponent)
      .setWidth('800px')
      .addAction('Close', () => this.dialogService.closeDialog())
      .open();
  }

  // ─── Paint ──────────────────────────────────────────────────────────────────
  selectToolbarPlant(key: string): void {
    if (key === 'erase') {
      this.selectedPlant.update(sp => ({ ...sp, currentZone: 'erase' }));
    } else {
      this.selectedPlant.set({ plant: { key, ...PLANT_MAP[key] }, currentZone: null });
    }
  }

  doSelectPlant($event: SelectedPlant): void {
    this.selectedPlant.set($event);
    this.closeModal();
  }

  clearPlantMode(): void {
    this.selectToolbarPlant('tomato');
  }

  // ─── Clear Dialog ────────────────────────────────────────────────────────────
  clearGrid(): void {
    this.dialogService.createDialog()
      .setTitle('Clear Garden')
      .setDialogContent('Are you sure you want to clear the entire garden? This action cannot be undone.')
      .addAction('Cancel')
      .addAction('Clear', () => {
        const v = this.gardenGridControl.value;
        this.gardenGridControl.setValue({ cols: v.cols, rows: v.rows, cells: [] });
      })
      .open();
  }

  // ─── Modal ──────────────────────────────────────────────────────────────────
  openModal(): void  {
    this.plantSelectorDialogOpen.set(true);
  }

  closeModal(): void {
    this.plantSelectorDialogOpen.set(false);
  }

  closeModalBackdrop(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) this.closeModal();
  }

  // ─── .garden export / import ─────────────────────────────────────────────────
  // TODO: Convert this to a JSON-based format instead of XML, and add support for plant-specific metadata (e.g. variety, planting date, etc.)
  async savePlan(): Promise<void> {
    const value    = this.gardenGridControl.value;
    const xml      = buildGardenXML(value);
    const encoded  = new TextEncoder().encode(xml);
    const cs       = new (window as any).CompressionStream('gzip');
    const writer   = cs.writable.getWriter();
    writer.write(encoded);
    writer.close();
    const compressed = new Uint8Array(await new Response(cs.readable).arrayBuffer());
    const blob = new Blob([compressed], { type: 'application/octet-stream' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `garden-plan-${value.cols}x${value.rows}.garden`;
    a.click();
    URL.revokeObjectURL(a.href);
    this.setFeedback(`✓ Saved garden-plan-${value.cols}x${value.rows}.garden (${(compressed.byteLength / 1024).toFixed(1)} KB gzipped)`, 'feedback-ok');
  }

  async loadPlan(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    input.value = '';

    try {
      const buffer = await file.arrayBuffer();
      const ds     = new (window as any).DecompressionStream('gzip');
      const writer = ds.writable.getWriter();
      writer.write(new Uint8Array(buffer));
      writer.close();
      const xml = await new Response(ds.readable).text();

      const doc      = new DOMParser().parseFromString(xml, 'application/xml');
      const parseErr = doc.querySelector('parsererror');
      if (parseErr) throw new Error('Invalid XML in .garden file');

      const value = parseGardenXML(doc);

      this.cols.set(value.cols);
      this.rows.set(value.rows);
      this.dimensionsFormGroup.setValue({ cols: value.cols, rows: value.rows });
      this.gardenGridControl.setValue(value);

      this.setFeedback(`✓ Loaded ${file.name} — ${value.cols}×${value.rows} ft, ${value.cells.length} sq ft planted`, 'feedback-ok');
    } catch (err: any) {
      this.setFeedback(`✗ Failed to load: ${err.message}`, 'feedback-err');
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  setFeedback(msg: string, cls: string): void {
    const fb = document.getElementById('cmd-feedback');
    if (!fb) return;
    fb.textContent = msg;
    fb.className   = cls;
  }
}
