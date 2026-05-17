import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlContainer, FormGroup } from '@angular/forms';

import { PLANT_MAP } from 'src/app/shared/constants/plant-map-constants';
import { SelectedPlant } from 'src/app/shared/models/selected-plant';

export interface GardenCellData {
  x: number;
  y: number;
  plant: string;
  groupId?: string;
}

export interface PlantGroup {
  id: string;
  plant: string;
  subtype?: string;
  notes?: string;
}

export interface GardenGridValue {
  cols: number;
  rows: number;
  cells: GardenCellData[];
  groups: PlantGroup[];
}


@Component({
  selector: 'garden-planner-grid',
  templateUrl: './garden-grid.html',
  styleUrl: './garden-grid.css',
})
export class GardenGrid {

  selectedPlant      = input.required<SelectedPlant>();
  paintedCountChange = output<number>();

  private controlContainer = inject(ControlContainer);
  private destroyRef       = inject(DestroyRef);

  readonly paintedCount = signal<number>(0);

  private cols   = 40;
  private rows   = 40;
  private cells:  GardenCellData[] = [];
  private groups: PlantGroup[]     = [];

  private isPainting = false;
  private gridMouseMoveListener: ((e: MouseEvent) => void) | null = null;

  // Box drawing state (ctrl+drag)
  private isBoxDrawing = false;
  private boxStartRow  = 0;
  private boxStartCol  = 0;
  private boxEndRow    = 0;
  private boxEndCol    = 0;
  private boxSnapshot  = new Map<string, { zone: string | undefined; color: string | undefined; groupId: string | undefined }>();

  private get gardenGroup(): FormGroup {
    return this.controlContainer.control as FormGroup;
  }

  private mouseUpListener = () => {
    if (this.isPainting) {
      if (this.isBoxDrawing) this.commitBox();
      this.notifyChange();
    }
    this.isPainting   = false;
    this.isBoxDrawing = false;
    this.boxSnapshot.clear();
  };

  // ─── Lifecycle ───────────────────────────────────────────────────────────────
  ngAfterViewInit(): void {
    document.addEventListener('mouseup', this.mouseUpListener);

    // React to external writes (applyDimensions, loadPlan, clearGrid)
    this.gardenGroup.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value: GardenGridValue) => {
        this.cols   = value.cols;
        this.rows   = value.rows;
        this.cells  = value.cells;
        this.groups = value.groups ?? [];
        this.buildGrid();
        this.applyStoredCells();
      });

    // Apply initial value
    const initial = this.gardenGroup.getRawValue() as GardenGridValue;
    this.cols   = initial.cols;
    this.rows   = initial.rows;
    this.cells  = initial.cells;
    this.groups = initial.groups ?? [];
    this.buildGrid();
    this.applyStoredCells();
  }

  ngOnDestroy(): void {
    document.removeEventListener('mouseup', this.mouseUpListener);
  }

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
          if (this.isBoxDrawing) return;
          if (e.shiftKey) {
            this.eraseCell(cell);
            return;
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
            this.isBoxDrawing = true;
            this.boxStartRow  = r;
            this.boxStartCol  = c;
            this.boxEndRow    = r;
            this.boxEndCol    = c;
            this.boxSnapshot.clear();
            this.boxSnapshot.set(`${r},${c}`, { zone: cell.dataset['zone'], color: cell.dataset['customColor'], groupId: cell.dataset['groupId'] });
            this.paintCellDirect(cell);
          } else {
            this.isBoxDrawing = false;
            this.paintCell(cell);
          }
        });

        grid.appendChild(cell);
      }
    }

    this.gridMouseMoveListener = (e: MouseEvent) => {
      if (!this.isPainting || !this.isBoxDrawing) return;

      const rect     = grid.getBoundingClientRect();
      const cellSize = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--cell-size')
      );
      let c = Math.floor((e.clientX - rect.left) / cellSize);
      let r = Math.floor((e.clientY - rect.top)  / cellSize);
      c = Math.max(0, Math.min(cols - 1, c));
      r = Math.max(0, Math.min(rows - 1, r));

      this.updateBox(grid, cols, r, c);
      this.boxEndRow = r;
      this.boxEndCol = c;
    };
    grid.addEventListener('mousemove', this.gridMouseMoveListener);

    this.paintedCount.set(0);
    this.paintedCountChange.emit(0);
  }

  private applyStoredCells(): void {
    const cellEls = document.querySelectorAll('.cell');
    let count = 0;
    for (const { x, y, plant, groupId } of this.cells) {
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
      if (groupId) cell.dataset['groupId'] = groupId;
      count++;
    }
    this.paintedCount.set(count);
    this.paintedCountChange.emit(count);
    this.applyGroupBorders();
  }

  private static readonly GROUP_COLORS = [
    '#ffd740', '#40c4ff', '#ff4081', '#69f0ae',
    '#ff6d00', '#e040fb', '#ccff90', '#ff6e40',
  ];

  private applyGroupBorders(): void {
    const grid  = document.getElementById('garden-grid')!;
    const cols  = this.cols;
    const rows  = this.rows;
    const cells = grid.children;

    const colorMap = new Map<string, string>();
    this.groups.forEach((g, i) => {
      colorMap.set(g.id, GardenGrid.GROUP_COLORS[i % GardenGrid.GROUP_COLORS.length]);
    });

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell    = cells[r * cols + c] as HTMLElement;
        const groupId = cell.dataset['groupId'];

        if (!groupId || !colorMap.has(groupId)) {
          cell.style.boxShadow = '';
          continue;
        }

        const color = colorMap.get(groupId)!;
        const aboveId = r > 0          ? (cells[(r - 1) * cols + c] as HTMLElement).dataset['groupId'] : undefined;
        const belowId = r < rows - 1   ? (cells[(r + 1) * cols + c] as HTMLElement).dataset['groupId'] : undefined;
        const leftId  = c > 0          ? (cells[r * cols + (c - 1)] as HTMLElement).dataset['groupId'] : undefined;
        const rightId = c < cols - 1   ? (cells[r * cols + (c + 1)] as HTMLElement).dataset['groupId'] : undefined;

        const shadows: string[] = [];
        if (aboveId !== groupId) shadows.push(`inset 0  2px 0 0 ${color}`);
        if (belowId !== groupId) shadows.push(`inset 0 -2px 0 0 ${color}`);
        if (leftId  !== groupId) shadows.push(`inset  2px 0 0 0 ${color}`);
        if (rightId !== groupId) shadows.push(`inset -2px 0 0 0 ${color}`);

        cell.style.boxShadow = shadows.join(', ');
      }
    }
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
      delete cell.dataset['groupId'];
      cell.style.background = '';
      this.paintedCount.update(c => Math.max(0, c - 1));
    }
  }

  private paintCellDirect(cell: HTMLElement): void {
    const selected = this.selectedPlant();
    if (selected.currentZone === 'erase') {
      delete cell.dataset['zone'];
      delete cell.dataset['customColor'];
      delete cell.dataset['groupId'];
      cell.style.background = '';
      return;
    }
    const color = selected.plant.color;
    cell.style.background       = color;
    cell.dataset['zone']        = 'custom';
    cell.dataset['customColor'] = color;
  }

  private restoreBoxCell(cell: HTMLElement, r: number, c: number): void {
    const key  = `${r},${c}`;
    const snap = this.boxSnapshot.get(key);
    if (!snap) return;
    if (snap.color) {
      cell.style.background       = snap.color;
      cell.dataset['zone']        = 'custom';
      cell.dataset['customColor'] = snap.color;
    } else if (snap.zone) {
      cell.dataset['zone']  = snap.zone;
      cell.style.background = '';
      delete cell.dataset['customColor'];
    } else {
      delete cell.dataset['zone'];
      delete cell.dataset['customColor'];
      cell.style.background = '';
    }
    if (snap.groupId) cell.dataset['groupId'] = snap.groupId;
    else              delete cell.dataset['groupId'];
    this.boxSnapshot.delete(key);
  }

  private updateBox(grid: HTMLElement, cols: number, newEndR: number, newEndC: number): void {
    const startR = this.boxStartRow;
    const startC = this.boxStartCol;

    const oldMinR = Math.min(startR, this.boxEndRow);
    const oldMaxR = Math.max(startR, this.boxEndRow);
    const oldMinC = Math.min(startC, this.boxEndCol);
    const oldMaxC = Math.max(startC, this.boxEndCol);

    const newMinR = Math.min(startR, newEndR);
    const newMaxR = Math.max(startR, newEndR);
    const newMinC = Math.min(startC, newEndC);
    const newMaxC = Math.max(startC, newEndC);

    const inNew = (r: number, c: number) =>
      r >= newMinR && r <= newMaxR && c >= newMinC && c <= newMaxC;

    for (let r = oldMinR; r <= oldMaxR; r++) {
      for (let c = oldMinC; c <= oldMaxC; c++) {
        if (!inNew(r, c)) {
          this.restoreBoxCell(grid.children[r * cols + c] as HTMLElement, r, c);
        }
      }
    }

    for (let r = newMinR; r <= newMaxR; r++) {
      for (let c = newMinC; c <= newMaxC; c++) {
        const key  = `${r},${c}`;
        const cell = grid.children[r * cols + c] as HTMLElement;
        if (!cell) continue;
        if (!this.boxSnapshot.has(key)) {
          this.boxSnapshot.set(key, { zone: cell.dataset['zone'], color: cell.dataset['customColor'], groupId: cell.dataset['groupId'] });
        }
        this.paintCellDirect(cell);
      }
    }
  }

  private commitBox(): void {
    if (this.selectedPlant().currentZone === 'erase') return;

    const grid   = document.getElementById('garden-grid')!;
    const cols   = this.cols;
    const groupId = crypto.randomUUID();
    const minR = Math.min(this.boxStartRow, this.boxEndRow);
    const maxR = Math.max(this.boxStartRow, this.boxEndRow);
    const minC = Math.min(this.boxStartCol, this.boxEndCol);
    const maxC = Math.max(this.boxStartCol, this.boxEndCol);

    this.groups.push({ id: groupId, plant: this.selectedPlant().plant.key });

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const cell = grid.children[r * cols + c] as HTMLElement;
        if (cell) cell.dataset['groupId'] = groupId;
      }
    }
  }

  // Called on mouseup — syncs DOM → gridControl without re-triggering valueChanges
  private notifyChange(): void {
    const cellEls = document.querySelectorAll('.cell');
    const cells: GardenCellData[] = [];
    const activeGroupIds = new Set<string>();

    cellEls.forEach((c: Element) => {
      const cell    = c as HTMLElement;
      const custom  = cell.dataset['customColor'];
      const zone    = cell.dataset['zone'];
      const groupId = cell.dataset['groupId'];
      if (!custom && !zone) return;
      const x = parseInt(cell.dataset['col']!);
      const y = parseInt(cell.dataset['row']!);
      const plant = custom
        ? (Object.keys(PLANT_MAP).find(k => PLANT_MAP[k].color === custom) ?? 'unknown')
        : zone!;
      const cellData: GardenCellData = { x, y, plant };
      if (groupId) {
        cellData.groupId = groupId;
        activeGroupIds.add(groupId);
      }
      cells.push(cellData);
    });

    this.groups = this.groups.filter(g => activeGroupIds.has(g.id));
    this.cells  = cells;
    const count = cells.length;
    this.paintedCount.set(count);
    this.paintedCountChange.emit(count);
    this.gardenGroup.setValue({ cols: this.cols, rows: this.rows, cells, groups: this.groups }, { emitEvent: false });
    this.gardenGroup.markAsTouched();
    this.applyGroupBorders();
  }
}
