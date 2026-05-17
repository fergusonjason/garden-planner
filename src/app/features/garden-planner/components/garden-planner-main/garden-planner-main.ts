import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { APPLICATION_VERSION } from 'src/app/core/tokens/application-version.token';
import { PLANT_MAP } from 'src/app/shared/constants/plant-map-constants';
import { SelectedPlant } from 'src/app/shared/models/selected-plant';
import { DialogService } from 'src/app/shared/services/dialog-service';
import { DimensionBar } from '../dimension-bar/dimension-bar';
import { GardenCellData, GardenGrid, PlantGroup } from '../garden-grid/garden-grid';
import { GardenService } from '../../services/garden-service';
import { PlantingSelector } from '../planting-selector/planting-selector';
import { PlantingToolbar } from '../planting-toolbar/planting-toolbar';
import { InstructionsComponent } from '../instructions-component/instructions.component';
import { ExportService } from 'src/app/core/services/export-service';

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

  private dialogService  = inject(DialogService);
  private formBuilder    = inject(FormBuilder);
  private gardenService  = inject(GardenService);
  private exportService = inject(ExportService);
  private destroyRef = inject(DestroyRef)

  applicationVersion = inject(APPLICATION_VERSION);

  readonly defaultCols = 40;
  readonly defaultRows = 40;

  // this is a reactive form instead of a signal for because SignalForms are not
  // stable and I don't trust the Angular core team not to totally change the
  // API. We'll talk again when they bother marking Signal forms stable.
  planForm = this.formBuilder.group({
    dimensions2: this.formBuilder.group({
      cols: [this.defaultCols, { nonNullable: true, validators: [Validators.required, Validators.min(5), Validators.max(200)] }],
      rows: [this.defaultRows, { nonNullable: true, validators: [Validators.required, Validators.min(5), Validators.max(200)] }],
    }),
    gardenGridData2: this.formBuilder.group({
      cols:   this.formBuilder.control<number>(this.defaultCols, { nonNullable: true }),
      rows:   this.formBuilder.control<number>(this.defaultRows, { nonNullable: true }),
      cells:  this.formBuilder.control<GardenCellData[]>([], { nonNullable: true }),
      groups: this.formBuilder.control<PlantGroup[]>([], { nonNullable: true }),
      notes:  this.formBuilder.control<string>('', { nonNullable: true }),
    }),
  });

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

    this.planForm.controls.gardenGridData2.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(value => {
        console.log(JSON.stringify(value, null,2));
      });
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.keydownListener);
  }

  // ─── Dimensions ─────────────────────────────────────────────────────────────
  applyDimensions(e: { cols: number, rows: number }): void {
    this.cols.set(e.cols);
    this.rows.set(e.rows);
    const notes = this.planForm.controls.gardenGridData2.value.notes ?? '';
    this.planForm.controls.gardenGridData2.setValue({ cols: e.cols, rows: e.rows, cells: [], groups: [], notes });
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
        const v = this.planForm.controls.gardenGridData2.value;
        this.planForm.controls.gardenGridData2.setValue({ cols: v.cols!, rows: v.rows!, cells: [], groups: [], notes: v.notes! });
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

  async savePlan($event: MouseEvent): Promise<void>{

    const form = this.planForm.getRawValue();
    const formStr = JSON.stringify(form);
    const now = new Date();
    await this.exportService.savePlan(formStr, `garden-plan-${now.getTime()}.garden.gz`);
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
      const json  = await new Response(ds.readable).text();
      const value = this.gardenService.parseGardenJSON(json);

      this.cols.set(value.cols);
      this.rows.set(value.rows);
      this.planForm.patchValue({ dimensions2: { cols: value.cols, rows: value.rows }, gardenGridData2: value });

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
