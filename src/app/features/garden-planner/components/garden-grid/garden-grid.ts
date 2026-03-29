import { Component, forwardRef, input, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { PLANT_MAP } from 'src/app/shared/constants/plant-map-constants';
import { SelectedPlant } from 'src/app/shared/models/selected-plant';

export interface GardenCellData {
  x: number;
  y: number;
  plant: string;
}

export interface GardenGridValue {
  cols: number;
  rows: number;
  cells: GardenCellData[];
}

export function buildGardenXML(value: GardenGridValue): string {
  const { cols, rows, cells } = value;
  const lines   = [`<?xml version="1.0" encoding="UTF-8"?>`, `<garden width="${cols}" height="${rows}" version="1">`];
  const painted: Record<string, string> = {};
  for (const { x, y, plant } of cells) {
    painted[`${x},${y}`] = plant;
  }
  for (let r = 0; r < rows; r++) {
    let rs = 0;
    while (rs < cols) {
      const plant = painted[`${rs},${r}`] ?? null;
      if (!plant) { rs++; continue; }
      let len = 1;
      while (rs + len < cols && painted[`${rs + len},${r}`] === plant) len++;
      lines.push(`  <span x="${rs}" y="${r}" len="${len}" plant="${plant}"/>`);
      rs += len;
    }
  }
  lines.push('</garden>');
  return lines.join('\n');
}

export function parseGardenXML(doc: Document): GardenGridValue {
  const garden  = doc.querySelector('garden')!;
  const cols    = parseInt(garden.getAttribute('width')!);
  const rows    = parseInt(garden.getAttribute('height')!);
  if (!cols || !rows) throw new Error('Missing width/height in .garden file');

  const cells: GardenCellData[] = [];
  doc.querySelectorAll('span').forEach(span => {
    const x     = parseInt(span.getAttribute('x')!);
    const y     = parseInt(span.getAttribute('y')!);
    const len   = parseInt(span.getAttribute('len')!);
    const plant = span.getAttribute('plant')!;
    for (let i = 0; i < len; i++) {
      const cx = x + i;
      if (cx >= cols || y >= rows) continue;
      cells.push({ x: cx, y, plant });
    }
  });

  return { cols, rows, cells };
}

@Component({
  selector: 'garden-planner-grid',
  templateUrl: './garden-grid.html',
  styleUrl: './garden-grid.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GardenGrid),
      multi: true,
    }
  ]
})
export class GardenGrid implements ControlValueAccessor {

  selectedPlant    = input.required<SelectedPlant>();
  paintedCountChange = output<number>();

  readonly paintedCount = signal<number>(0);

  private cols = 40;
  private rows = 40;
  private cells: GardenCellData[] = [];

  private viewInitialized = false;
  private isPainting = false;
  private straightLockRow: number | null = null;
  private straightLockCol: number | null = null;
  private straightAxis: 'row' | 'col' | null = null;
  private gridMouseMoveListener: ((e: MouseEvent) => void) | null = null;

  private onChange: (value: GardenGridValue) => void = () => {};
  private onTouched: () => void = () => {};

  private mouseUpListener = () => {
    if (this.isPainting) {
      this.onTouched();
      this.notifyChange();
    }
    this.isPainting      = false;
    this.straightLockRow = null;
    this.straightLockCol = null;
    this.straightAxis    = null;
  };

  // ─── Lifecycle ───────────────────────────────────────────────────────────────
  ngAfterViewInit(): void {
    this.viewInitialized = true;
    document.addEventListener('mouseup', this.mouseUpListener);
    this.buildGrid();
    this.applyStoredCells();
  }

  ngOnDestroy(): void {
    document.removeEventListener('mouseup', this.mouseUpListener);
  }

  // ─── ControlValueAccessor ───────────────────────────────────────────────────
  writeValue(value: GardenGridValue | null): void {
    this.cols  = value?.cols  ?? 40;
    this.rows  = value?.rows  ?? 40;
    this.cells = value?.cells ?? [];
    if (this.viewInitialized) {
      this.buildGrid();
      this.applyStoredCells();
    }
  }

  registerOnChange(fn: (value: GardenGridValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void {}

  // ─── Grid ───────────────────────────────────────────────────────────────────
  private buildGrid(): void {
    const grid   = document.getElementById('garden-grid')!;
    const rulerX = document.getElementById('ruler-x')!;
    const rulerY = document.getElementById('ruler-y')!;

    if (this.gridMouseMoveListener) {
      grid.removeEventListener('mousemove', this.gridMouseMoveListener);
      this.gridMouseMoveListener = null;
    }

    grid.innerHTML   = '';
    rulerX.innerHTML = '';
    rulerY.innerHTML = '';

    const cols = this.cols;
    const rows = this.rows;

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

    this.paintedCount.set(0);
    this.paintedCountChange.emit(0);
  }

  private applyStoredCells(): void {
    const cellEls = document.querySelectorAll('.cell');
    let count = 0;
    for (const { x, y, plant } of this.cells) {
      if (x >= this.cols || y >= this.rows) continue;
      const cell  = cellEls[y * this.cols + x] as HTMLElement;
      if (!cell) continue;
      const color = PLANT_MAP[plant]?.color ?? null;
      if (color) {
        cell.style.background       = color;
        cell.dataset['zone']        = 'custom';
        cell.dataset['customColor'] = color;
      } else {
        cell.dataset['zone'] = plant;
      }
      count++;
    }
    this.paintedCount.set(count);
    this.paintedCountChange.emit(count);
  }

  // ─── Paint ──────────────────────────────────────────────────────────────────
  private paintCell(cell: HTMLElement): void {
    const selected = this.selectedPlant();
    if (selected.currentZone === 'erase') {
      this.eraseCell(cell);
      return;
    }
    const color    = selected.plant.color;
    const hadColor = cell.dataset['zone'] || cell.dataset['customColor'];
    if (!hadColor) this.paintedCount.update(c => c + 1);
    cell.style.background       = color;
    cell.dataset['zone']        = 'custom';
    cell.dataset['customColor'] = color;
  }

  private eraseCell(cell: HTMLElement): void {
    if (cell.dataset['zone'] || cell.dataset['customColor']) {
      delete cell.dataset['zone'];
      delete cell.dataset['customColor'];
      cell.style.background = '';
      this.paintedCount.update(c => Math.max(0, c - 1));
    }
  }

  // Called on mouseup — syncs DOM → this.cells and fires onChange
  private notifyChange(): void {
    const cellEls = document.querySelectorAll('.cell');
    const cells: GardenCellData[] = [];
    cellEls.forEach((c: Element) => {
      const cell   = c as HTMLElement;
      const custom = cell.dataset['customColor'];
      const zone   = cell.dataset['zone'];
      if (!custom && !zone) return;
      const x = parseInt(cell.dataset['col']!);
      const y = parseInt(cell.dataset['row']!);
      const plant = custom
        ? (Object.keys(PLANT_MAP).find(k => PLANT_MAP[k].color === custom) ?? 'unknown')
        : zone!;
      cells.push({ x, y, plant });
    });
    this.cells = cells;
    const count = cells.length;
    this.paintedCount.set(count);
    this.paintedCountChange.emit(count);
    this.onChange({ cols: this.cols, rows: this.rows, cells });
  }
}
