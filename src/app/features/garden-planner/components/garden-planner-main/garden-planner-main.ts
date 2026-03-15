import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { ExportService } from 'src/app/core/services/export-service';
import { ContextMenu } from 'src/app/features/garden-planner-main/components/context-menu/context-menu';
import { PLANT_MAP } from 'src/app/shared/constants/plant-map-constants';
import { PlantDef } from 'src/app/shared/models/plant-def';
import { DEFAULT_SELECTED_PLANT, SelectedPlant } from 'src/app/shared/models/selected-plant';
import { DimensionBar } from '../dimension-bar/dimension-bar';
import { PlantingSelector } from '../planting-selector/planting-selector';
import { PlantingToolbar } from '../planting-toolbar/planting-toolbar';
import { DialogService } from 'src/app/shared/services/dialog-service';
import { APPLICATION_VERSION } from 'src/app/core/tokens/application-version.token';
import { InstructionsComponent } from '../../instructions-component/instructions.component';

@Component({
  selector: 'garden-planner-main',
  imports: [
    CommonModule,
    DimensionBar,
    PlantingSelector,
    PlantingToolbar,
    ContextMenu
],
  templateUrl: './garden-planner-main.html',
  styleUrl: './garden-planner-main.css',
})
export class GardenPlannerMain {

  private exportService:ExportService = inject(ExportService);
  private dialogService = inject(DialogService);

  applicationVersion = inject(APPLICATION_VERSION);

  readonly defaultCols = 40;
  readonly defaultRows = 40;

  // ─── Grid dimensions ────────────────────────────────────────────────────────
  cols = signal<number>(this.defaultCols);
  rows = signal<number>(this.defaultRows);
  dimWarning = false;

  subtitle = computed<string>(() => {

    const cols = this.cols();
    const rows = this.rows();
    const sqFt = cols * rows;

    const result = `${cols} ft × ${rows} ft · ${sqFt} sq ft · 1 cell = 1 sq ft`;
    return result;
  });

  // ─── Paint state ────────────────────────────────────────────────────────────
  // TODO: Stop using the individual activePlant* properties and just derive them from the selectedPlant signal
  selectedPlant = signal<SelectedPlant>(DEFAULT_SELECTED_PLANT);

  /* @deprecated("use the selected plant signal") */ activePlantKey    = 'tomato';
  activePlantColor: string | null = null;
  activePlantName: string | null  = null;
  currentZone: string | null      = null;
  selectedModalKey: string | null = null;
  isPainting = false;
  paintedCount = signal<number>(0);
  // paintedCount = 0;
  nextCol = 0;
  nextRow = 0;
  straightLockRow: number | null = null;
  straightLockCol: number | null = null;
  straightAxis: 'row' | 'col' | null = null;

  // ─── Modal ──────────────────────────────────────────────────────────────────
  clearDialogOpen = false;
  plantSelectorDialogOpen = signal<boolean>(false);

  // ─── Context menu ────────────────────────────────────────────────────────────
  ctxMenuOpen = signal<boolean>(false);
  ctxMenuX    = signal<number>(0);
  ctxMenuY    = signal<number>(0);

  // ─── Plant data exposed to template ─────────────────────────────────────────
  readonly plantEntries: PlantDef[] = Object.entries(PLANT_MAP).map(([key, p]) => ({ key, ...p }));


  // ─── Listeners ───────────────────────────────────────────────────────────────
  private mouseUpListener = () => {
    this.isPainting      = false;
    this.straightLockRow = null;
    this.straightLockCol = null;
    this.straightAxis    = null;
  };

private keydownListener = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    this.closeModal();
    this.closeCtxMenu();
    this.clearDialogOpen = false;
  }
};

  private docClickListener = (e: MouseEvent) => {
    const menu = document.querySelector('.ctx-menu');
    if (menu && !menu.contains(e.target as Node)) {
      this.closeCtxMenu();
    }
  };

  private gridMouseMoveListener: ((e: MouseEvent) => void) | null = null;

  // ─── Lifecycle ───────────────────────────────────────────────────────────────
  ngAfterViewInit(): void {
    document.addEventListener('mouseup', this.mouseUpListener);
    document.addEventListener('keydown', this.keydownListener);
    document.addEventListener('click', this.docClickListener);

    ['inp-cols', 'inp-rows'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => { this.dimWarning = true; });
    });

    this.buildGrid();

    // Default to tomatoes selected
    this.activePlantColor = PLANT_MAP['tomato'].color;
    this.activePlantName  = 'tomatoes';
  }

  ngOnDestroy(): void {
    document.removeEventListener('mouseup', this.mouseUpListener);
    document.removeEventListener('keydown', this.keydownListener);
    document.removeEventListener('click', this.docClickListener);
  }

  // ─── Dimensions ─────────────────────────────────────────────────────────────
  applyDimensions(e: { cols: number, rows: number }): void {
    this.cols.set(e.cols);
    this.rows.set(e.rows);
    this.dimWarning = false;
    this.buildGrid();
  }

  doOpenInstructions(): void {
    this.dialogService.createDialog()
      .setTitle('Garden Planner Instructions')
      .setDialogContent(InstructionsComponent)
      .setWidth('800px')
      .addAction('Close', () => this.dialogService.closeDialog())
      .open();
  }

  // ─── Grid ───────────────────────────────────────────────────────────────────
  buildGrid(): void {
    const grid   = document.getElementById('garden-grid')!;
    const rulerX = document.getElementById('ruler-x')!;
    const rulerY = document.getElementById('ruler-y')!;

    if (this.gridMouseMoveListener) {
      grid.removeEventListener('mousemove', this.gridMouseMoveListener);
      this.gridMouseMoveListener = null;
    }

    grid.innerHTML = '';
    rulerX.innerHTML = '';
    rulerY.innerHTML = '';

    const cols = this.cols();
    const rows = this.rows();

    grid.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
    grid.style.gridTemplateRows    = `repeat(${rows}, var(--cell-size))`;

    for (let c = 0; c < cols; c++) {
      const d = document.createElement('div');
      d.className = 'ruler-cell' + ((c + 1) % 5 === 0 ? ' labeled' : '');
      d.textContent = (c + 1) % 5 === 0 ? String(c + 1) : '';
      rulerX.appendChild(d);
    }

    for (let r = 0; r < rows; r++) {
      const d = document.createElement('div');
      d.className = 'ruler-cell' + ((r + 1) % 5 === 0 ? ' labeled' : '');
      d.textContent = (r + 1) % 5 === 0 ? String(r + 1) : '';
      rulerY.appendChild(d);
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        if ((c + 1) % 5 === 0 && c + 1 < cols) cell.classList.add('mark-col');
        if ((r + 1) % 5 === 0 && r + 1 < rows) cell.classList.add('mark-row');
        cell.dataset['row'] = String(r);
        cell.dataset['col'] = String(c);

        cell.addEventListener('mouseenter', (e: MouseEvent) => {
          if (!this.isPainting) return;
          if (e.shiftKey) {
            this.eraseCell(cell);
            return;
          }
          if (this.straightLockRow !== null) {
            if (this.straightAxis === null) {
              const dr = Math.abs(r - this.straightLockRow!);
              const dc = Math.abs(c - this.straightLockCol!);
              if (dr === 0 && dc === 0) return;
              this.straightAxis = dc >= dr ? 'row' : 'col';
            }
            if (this.straightAxis === 'row' && r !== this.straightLockRow) return;
            if (this.straightAxis === 'col' && c !== this.straightLockCol) return;
          }
          this.paintCell(cell);
        });

        cell.addEventListener('mousedown', (e: MouseEvent) => {
          e.preventDefault();
          if (e.button === 2) return;
          this.isPainting = true;
          if (e.shiftKey) {
            this.eraseCell(cell);
            return;
          }
          if (e.ctrlKey || e.metaKey) {
            this.straightLockRow = r;
            this.straightLockCol = c;
            this.straightAxis    = null;
          } else {
            this.straightLockRow = null;
            this.straightLockCol = null;
            this.straightAxis    = null;
          }
          this.paintCell(cell);
        });

        grid.appendChild(cell);
      }
    }

    this.gridMouseMoveListener = (e: MouseEvent) => {
      if (!this.isPainting || this.straightLockRow === null) return;

      const rect     = grid.getBoundingClientRect();
      const cellSize = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--cell-size')
      );
      let c = Math.floor((e.clientX - rect.left) / cellSize);
      let r = Math.floor((e.clientY - rect.top)  / cellSize);
      c = Math.max(0, Math.min(cols - 1, c));
      r = Math.max(0, Math.min(rows - 1, r));

      if (this.straightAxis === null) {
        const dr = Math.abs(r - this.straightLockRow!);
        const dc = Math.abs(c - this.straightLockCol!);
        if (dr === 0 && dc === 0) return;
        this.straightAxis = dc >= dr ? 'row' : 'col';
      }

      if (this.straightAxis === 'row') r = this.straightLockRow!;
      if (this.straightAxis === 'col') c = this.straightLockCol!;

      const cells = grid.querySelectorAll('.cell');
      const cell  = cells[r * cols + c] as HTMLElement;
      if (cell) this.paintCell(cell);
    };
    grid.addEventListener('mousemove', this.gridMouseMoveListener);

    grid.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      this.openCtxMenu(e.clientX, e.clientY);
    });

    this.paintedCount.set(0);
    this.nextCol = 0;
    this.nextRow = 0;
    this.setFeedback('', '');
  }

  // ─── Paint ──────────────────────────────────────────────────────────────────
  selectToolbarPlant(key: string): void {
    this.activePlantKey   = key;
    this.selectedModalKey = null;

    if (key === 'erase') {
      this.currentZone      = 'erase';
      this.activePlantColor = null;
      this.activePlantName  = null;
    } else {
      const p = PLANT_MAP[key];
      this.currentZone      = null;
      this.activePlantColor = p.color;
      this.activePlantName  = p.aliases[0];
    }
  }

  doSelectPlant($event: SelectedPlant): void {
    this.selectedPlant.set($event);

    this.selectedModalKey = $event.selectedModalKey;
    this.activePlantKey   = $event.activePlantKey;
    this.currentZone      = $event.currentZone;
    this.activePlantColor = $event.activePlantColor;
    this.activePlantName  = $event.activePlantName;
    this.closeModal();
  }

  clearPlantMode(): void {
    this.selectedModalKey = null;
    this.selectToolbarPlant('tomato');
  }

  paintCell(cell: HTMLElement): void {
    const hadColor = cell.dataset['zone'] || cell.dataset['customColor'];

    if (this.activePlantColor) {
      if (!hadColor) this.paintedCount.update(c => c + 1);
      cell.style.background       = this.activePlantColor;
      cell.dataset['zone']        = 'custom';
      cell.dataset['customColor'] = this.activePlantColor;
    } else if (this.currentZone === 'erase') {
      this.eraseCell(cell);
      return;
    } else if (this.currentZone) {
      if (!hadColor) this.paintedCount.update(c => c + 1);
      cell.dataset['zone'] = this.currentZone;
      delete cell.dataset['customColor'];
      cell.style.background = '';
    }

  }

  eraseCell(cell: HTMLElement): void {
    if (cell.dataset['zone'] || cell.dataset['customColor']) {
      delete cell.dataset['zone'];
      delete cell.dataset['customColor'];
      cell.style.background = '';
      this.paintedCount.update(c => Math.max(0, c - 1));

    }
  }

  // ─── Clear Dialog ──────────────────────────────────────────────────────────────────
  clearGrid(): void {

    this.dialogService.createDialog()
      .setTitle('Clear Garden')
      .setDialogContent('Are you sure you want to clear the entire garden? This action cannot be undone.')
      .addAction('Cancel')
      .addAction('Clear', () => this.clearGarden())
      .open();
  }

  private clearGarden(): void {
    this.clearDialogOpen = false;
    document.querySelectorAll('.cell').forEach((c: Element) => {
      const el = c as HTMLElement;
      delete el.dataset['zone'];
      delete el.dataset['customColor'];
      el.style.background = '';
    });
    this.paintedCount.set(0);
    this.nextCol = 0;
    this.nextRow = 0;
    this.setFeedback('', '');
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

  // ─── Context menu ────────────────────────────────────────────────────────────
  openCtxMenu(x: number, y: number): void {
    const menuW = 180, menuH = 160;
    this.ctxMenuX.set(x + menuW > window.innerWidth  ? x - menuW : x);
    this.ctxMenuY.set(y + menuH > window.innerHeight ? y - menuH : y);
    this.ctxMenuOpen.set(true);
  }

  closeCtxMenu(): void {
    this.ctxMenuOpen.set(false);
  }

  ctxExportPNG(): void { this.closeCtxMenu(); this.exportService.exportPNG(this.cols(), this.rows()); }
  ctxExportPDF(): void { this.closeCtxMenu(); this.exportService.exportPDF(); }

  selectQuickPick(key: string): void {
    this.selectToolbarPlant(key);
    this.closeCtxMenu();
  }

  // ─── Plant command ───────────────────────────────────────────────────────────
  findPlant(text: string): PlantDef | null {
    const t = text.toLowerCase();
    for (const [key, p] of Object.entries(PLANT_MAP)) {
      if (p.aliases.some(a => t.includes(a))) return { key, ...p };
    }
    return null;
  }

  createRows(count: number, plant: PlantDef, startAt: number | null, orientation: string, endAt: number | null): { ok: boolean; msg: string } {
    const isVert = orientation === 'vertical';
    const cells  = document.querySelectorAll('.cell');
    const sep    = plant.gap - plant.rowWidth;
    const limit  = isVert ? this.cols() : this.rows();
    const start  = startAt !== null ? startAt : (isVert ? this.nextCol : this.nextRow);

    let resolvedCount = count;
    if (endAt !== null) {
      const span = endAt - start;
      if (span <= 0) return { ok: false, msg: '✗ End position must be greater than start position.' };
      resolvedCount = Math.floor((span - plant.rowWidth) / plant.gap) + 1;
      if (resolvedCount < 1) resolvedCount = 1;
    }

    const totalSpan = plant.rowWidth + (resolvedCount - 1) * plant.gap;
    if (start + totalSpan > limit) {
      return { ok: false, msg: `✗ Not enough space — only ${limit - start} ft remaining from ${isVert ? 'X' : 'Y'}=${start + 1}.` };
    }

    for (let i = 0; i < resolvedCount; i++) {
      const lineStart = start + i * plant.gap;
      const crossLimit = isVert ? this.rows() : this.cols();
      for (let cross = 0; cross < crossLimit; cross++) {
        for (let w = 0; w < plant.rowWidth; w++) {
          const along = lineStart + w;
          if (along >= limit) continue;
          const idx  = isVert ? (cross * this.cols() + along) : (along * this.cols() + cross);
          const cell = cells[idx] as HTMLElement;
          if (!cell) continue;
          if (!cell.dataset['customColor'] && !cell.dataset['zone']) this.paintedCount.update(c => c + 1);
          cell.style.background       = plant.color;
          cell.dataset['zone']        = 'custom';
          cell.dataset['customColor'] = plant.color;
        }
      }
    }

    const endPos = start + totalSpan;
    if (isVert) { if (endPos > this.nextCol) this.nextCol = endPos; }
    else         { if (endPos > this.nextRow) this.nextRow = endPos; }

    const axis     = isVert ? 'X' : 'Y';
    const nextFree = isVert ? this.nextCol : this.nextRow;
    return {
      ok: true,
      msg: `✓ Planted ${resolvedCount} ${orientation} row${resolvedCount > 1 ? 's' : ''} of ${plant.aliases[0]} — ${plant.rowWidth}ft wide, ${sep}ft gap — ${axis}=${start + 1}–${endPos}ft. Next free: ${axis}=${nextFree + 1}ft.`
    };
  }


  // ─── .garden export / import ─────────────────────────────────────────────────
  // TODO: Convert this to a JSON-based format instead of XML, and add support for plant-specific metadata (e.g. variety, planting date, etc.)
  private buildXML(): string {
    const cells = document.querySelectorAll('.cell');
    const lines = [`<?xml version="1.0" encoding="UTF-8"?>`, `<garden width="${this.cols}" height="${this.rows}" version="1">`];
    const painted: Record<string, string> = {};

    cells.forEach((c: Element) => {
      const cell   = c as HTMLElement;
      const custom = cell.dataset['customColor'];
      const zone   = cell.dataset['zone'];
      if (!custom && !zone) return;
      let plant: string;
      if (custom) {
        plant = Object.keys(PLANT_MAP).find(k => PLANT_MAP[k].color === custom) || 'unknown';
      } else {
        plant = zone!;
      }
      painted[`${cell.dataset['col']},${cell.dataset['row']}`] = plant;
    });

    for (let r = 0; r < this.rows(); r++) {
      let rs = 0;
      while (rs < this.cols()) {
        const plant = painted[`${rs},${r}`] || null;
        if (!plant) { rs++; continue; }
        let len = 1;
        while (rs + len < this.cols() && (painted[`${rs + len},${r}`] || null) === plant) len++;
        lines.push(`  <span x="${rs}" y="${r}" len="${len}" plant="${plant}"/>`);
        rs += len;
      }
    }
    lines.push('</garden>');
    return lines.join('\n');
  }

  async savePlan(): Promise<void> {
    const xml      = this.buildXML();
    const encoded  = new TextEncoder().encode(xml);
    const cs       = new (window as any).CompressionStream('gzip');
    const writer   = cs.writable.getWriter();
    writer.write(encoded);
    writer.close();
    const compressed = new Uint8Array(await new Response(cs.readable).arrayBuffer());
    const blob = new Blob([compressed], { type: 'application/octet-stream' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `garden-plan-${this.cols}x${this.rows}.garden`;
    a.click();
    URL.revokeObjectURL(a.href);
    this.setFeedback(`✓ Saved garden-plan-${this.cols}x${this.rows}.garden (${(compressed.byteLength / 1024).toFixed(1)} KB gzipped)`, 'feedback-ok');
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

      const garden  = doc.querySelector('garden')!;
      const newCols = parseInt(garden.getAttribute('width')!);
      const newRows = parseInt(garden.getAttribute('height')!);

      if (!newCols || !newRows)
        throw new Error('Missing width/height in .garden file');

      // this.cols      = newCols;
      this.cols.set(newCols);
      // this.rows      = newRows;
      this.rows.set(newRows);
      this.buildGrid();

      const cellEls = document.querySelectorAll('.cell');
      let count = 0;
      doc.querySelectorAll('span').forEach(span => {
        const x     = parseInt(span.getAttribute('x')!);
        const y     = parseInt(span.getAttribute('y')!);
        const len   = parseInt(span.getAttribute('len')!);
        const plant = span.getAttribute('plant')!;
        const color = PLANT_MAP[plant]?.color ?? null;
        for (let i = 0; i < len; i++) {
          const col = x + i;
          if (col >= this.cols() || y >= this.rows()) continue;
          const cell = cellEls[y * this.cols() + col] as HTMLElement;
          if (!cell) continue;
          if (color) {
            cell.style.background       = color;
            cell.dataset['zone']        = 'custom';
            cell.dataset['customColor'] = color;
          } else {
            cell.dataset['zone'] = plant;
          }
          count++;
        }
      });

      this.paintedCount.set(count);
      this.setFeedback(`✓ Loaded ${file.name} — ${this.cols}×${this.rows} ft, ${count} sq ft planted`, 'feedback-ok');
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
