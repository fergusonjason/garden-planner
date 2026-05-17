import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlContainer, FormGroup } from '@angular/forms';

import { PLANT_MAP } from 'src/app/shared/constants/plant-map-constants';
import { SelectedPlant } from 'src/app/shared/models/selected-plant';
import { DialogService } from 'src/app/shared/services/dialog-service';
import { EditGroupComponent, EditGroupData } from '../edit-group/edit-group';
import { EditPlanNotesComponent } from '../edit-plan-notes/edit-plan-notes';

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
  cols:   number;
  rows:   number;
  cells:  GardenCellData[];
  groups: PlantGroup[];
  notes:  string;
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
  private dialogService    = inject(DialogService);

  readonly paintedCount = signal<number>(0);

  private cols      = 40;
  private rows      = 40;
  private cells:    GardenCellData[] = [];
  private groups:   PlantGroup[]     = [];
  private planNotes = '';

  private isPainting      = false;
  private hoveredGroupId: string | null = null;
  private contextMenu:    HTMLElement | null = null;
  private gridMouseMoveListener: ((e: MouseEvent) => void) | null = null;

  // Box drawing state (ctrl+drag)
  private isBoxDrawing = false;
  private boxStartRow  = 0;
  private boxStartCol  = 0;
  private boxEndRow    = 0;
  private boxEndCol    = 0;
  private boxSnapshot  = new Map<string, { zone: string | undefined; color: string | undefined; groupId: string | undefined }>();

  // Group resize state
  private isResizing     = false;
  private resizeGroupId  = '';
  private resizeFixedR   = 0;
  private resizeFixedC   = 0;
  private resizeCurrentR = 0;
  private resizeCurrentC = 0;
  private resizeLockRow  = false;  // edge handles: freeze row dimension
  private resizeLockCol  = false;  // edge handles: freeze col dimension
  private resizeSnapshot = new Map<string, { zone: string | undefined; color: string | undefined; groupId: string | undefined }>();

  // Group move state
  private isMoving          = false;
  private moveGroupId       = '';
  private moveAnchorR       = 0;
  private moveAnchorC       = 0;
  private moveDeltaR        = 0;
  private moveDeltaC        = 0;
  private moveBoundsMinR    = 0;
  private moveBoundsMaxR    = 0;
  private moveBoundsMinC    = 0;
  private moveBoundsMaxC    = 0;
  private moveOriginalCells: Array<{ r: number; c: number }> = [];
  private moveSnapshot      = new Map<string, { zone: string | undefined; color: string | undefined; groupId: string | undefined }>();
  private moveHasConflict   = false;

  private readonly resizeMoveHandler = (e: MouseEvent) => {
    if (!this.isResizing) return;
    const grid     = document.getElementById('garden-grid')!;
    const rect     = grid.getBoundingClientRect();
    const cellSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-size'));
    let c = Math.floor((e.clientX - rect.left) / cellSize);
    let r = Math.floor((e.clientY - rect.top)  / cellSize);
    c = Math.max(0, Math.min(this.cols - 1, c));
    r = Math.max(0, Math.min(this.rows - 1, r));
    if (this.resizeLockRow) r = this.resizeCurrentR;
    if (this.resizeLockCol) c = this.resizeCurrentC;
    if (r === this.resizeCurrentR && c === this.resizeCurrentC) return;
    this.updateResizeBox(r, c);
  };

  private readonly contextMenuCloseHandler = (e: MouseEvent) => {
    if (this.contextMenu && !this.contextMenu.contains(e.target as Node)) {
      this.closeContextMenu();
    }
  };

  private readonly contextMenuKeyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.closeContextMenu();
  };

  private readonly moveDragHandler = (e: MouseEvent) => {
    if (!this.isMoving) return;
    const grid     = document.getElementById('garden-grid')!;
    const rect     = grid.getBoundingClientRect();
    const cellSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-size'));
    let c = Math.floor((e.clientX - rect.left) / cellSize);
    let r = Math.floor((e.clientY - rect.top)  / cellSize);
    c = Math.max(0, Math.min(this.cols - 1, c));
    r = Math.max(0, Math.min(this.rows - 1, r));

    let deltaR = r - this.moveAnchorR;
    let deltaC = c - this.moveAnchorC;
    deltaR = Math.max(deltaR, -this.moveBoundsMinR);
    deltaR = Math.min(deltaR, this.rows - 1 - this.moveBoundsMaxR);
    deltaC = Math.max(deltaC, -this.moveBoundsMinC);
    deltaC = Math.min(deltaC, this.cols - 1 - this.moveBoundsMaxC);

    if (deltaR === this.moveDeltaR && deltaC === this.moveDeltaC) return;
    this.updateMovePosition(deltaR, deltaC);
  };

  private get gardenGroup(): FormGroup {
    return this.controlContainer.control as FormGroup;
  }

  private mouseUpListener = () => {
    if (this.isMoving) {
      if (this.moveHasConflict) this.updateMovePosition(0, 0);
      this.notifyChange();
      this.isMoving          = false;
      this.moveHasConflict   = false;
      this.moveOriginalCells = [];
      this.moveSnapshot.clear();
      return;
    }
    if (this.isResizing) {
      this.notifyChange();
      this.isResizing = false;
      this.resizeSnapshot.clear();
      return;
    }
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
    document.addEventListener('mouseup',   this.mouseUpListener);
    document.addEventListener('mousemove', this.resizeMoveHandler);
    document.addEventListener('mousemove', this.moveDragHandler);
    document.addEventListener('mousedown', this.contextMenuCloseHandler);
    document.addEventListener('keydown',   this.contextMenuKeyHandler);

    // React to external writes (applyDimensions, loadPlan, clearGrid)
    this.gardenGroup.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value: GardenGridValue) => {
        this.cols      = value.cols;
        this.rows      = value.rows;
        this.cells     = value.cells;
        this.groups    = value.groups ?? [];
        this.planNotes = value.notes  ?? '';
        this.buildGrid();
        this.applyStoredCells();
      });

    // Apply initial value
    const initial  = this.gardenGroup.getRawValue() as GardenGridValue;
    this.cols      = initial.cols;
    this.rows      = initial.rows;
    this.cells     = initial.cells;
    this.groups    = initial.groups ?? [];
    this.planNotes = initial.notes  ?? '';
    this.buildGrid();
    this.applyStoredCells();
  }

  ngOnDestroy(): void {
    document.removeEventListener('mouseup',   this.mouseUpListener);
    document.removeEventListener('mousemove', this.resizeMoveHandler);
    document.removeEventListener('mousemove', this.moveDragHandler);
    document.removeEventListener('mousedown', this.contextMenuCloseHandler);
    document.removeEventListener('keydown',   this.contextMenuKeyHandler);
    this.closeContextMenu();
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
          if (!this.isResizing && !this.isMoving) {
            const gid = cell.dataset['groupId'] ?? null;
            if (gid !== this.hoveredGroupId) {
              this.hoveredGroupId = gid;
              this.applyGroupHandles();
            }
          }
          if (!this.isPainting) return;
          if (this.isBoxDrawing) return;
          if (e.shiftKey) {
            this.eraseCell(cell);
            return;
          }
          this.paintCell(cell);
        });

        cell.addEventListener('contextmenu', (e: MouseEvent) => {
          e.preventDefault();
          this.showContextMenu(e.clientX, e.clientY, cell.dataset['groupId'] ?? null);
        });

        cell.addEventListener('mousedown', (e: MouseEvent) => {
          e.preventDefault();
          if (e.button === 2) return;
          if (e.shiftKey) {
            this.isPainting = true;
            this.eraseCell(cell);
            return;
          }
          if (e.ctrlKey || e.metaKey) {
            if (cell.dataset['groupId']) {
              this.startMove(cell.dataset['groupId'], r, c);
            } else {
              this.isPainting   = true;
              this.isBoxDrawing = true;
              this.boxStartRow  = r;
              this.boxStartCol  = c;
              this.boxEndRow    = r;
              this.boxEndCol    = c;
              this.boxSnapshot.clear();
              this.boxSnapshot.set(`${r},${c}`, { zone: cell.dataset['zone'], color: cell.dataset['customColor'], groupId: cell.dataset['groupId'] });
              this.paintCellDirect(cell);
            }
          } else {
            this.isPainting   = true;
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
    grid.addEventListener('mouseleave', () => {
      if (!this.isResizing && !this.isMoving && this.hoveredGroupId !== null) {
        this.hoveredGroupId = null;
        this.applyGroupHandles();
      }
    });

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
    this.applyGroupHandles();
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
    this.gardenGroup.setValue({ cols: this.cols, rows: this.rows, cells, groups: this.groups, notes: this.planNotes }, { emitEvent: false });
    this.gardenGroup.markAsTouched();
    this.applyGroupBorders();
    this.applyGroupHandles();
  }

  // ─── Group resize ────────────────────────────────────────────────────────────
  private applyGroupHandles(): void {
    const layer  = document.getElementById('group-handles-layer');
    const gridEl = document.getElementById('garden-grid');
    if (!layer || !gridEl) return;

    layer.innerHTML = '';

    const targetId = this.isResizing ? this.resizeGroupId
                   : this.isMoving   ? this.moveGroupId
                   : this.hoveredGroupId;
    if (!targetId) return;

    const group = this.groups.find(g => g.id === targetId);
    if (!group) return;

    const cellSize  = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-size'));
    const layerRect = layer.parentElement!.getBoundingClientRect();
    const gridRect  = gridEl.getBoundingClientRect();
    const offX      = gridRect.left - layerRect.left;
    const offY      = gridRect.top  - layerRect.top;

    const groupIndex = this.groups.indexOf(group);

    // Compute bounding box for target group only
    const bounds = new Map<string, { minR: number; maxR: number; minC: number; maxC: number }>();
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const gid = (gridEl.children[r * this.cols + c] as HTMLElement).dataset['groupId'];
        if (gid !== targetId) continue;
        const b = bounds.get(gid) ?? { minR: Infinity, maxR: -Infinity, minC: Infinity, maxC: -Infinity };
        if (r < b.minR) b.minR = r;
        if (r > b.maxR) b.maxR = r;
        if (c < b.minC) b.minC = c;
        if (c > b.maxC) b.maxC = c;
        bounds.set(gid, b);
      }
    }

    const H = 8, HALF = H / 2;

    {
      const b = bounds.get(group.id);
      if (!b || b.minR === Infinity) return;
      const color = GardenGrid.GROUP_COLORS[groupIndex % GardenGrid.GROUP_COLORS.length];

      const midX = offX + (b.minC + b.maxC + 1) / 2 * cellSize;
      const midY = offY + (b.minR + b.maxR + 1) / 2 * cellSize;

      type HandleDef = { px: number; py: number; fixedR: number; fixedC: number; activeR: number; activeC: number; lockRow: boolean; lockCol: boolean; cursor: string };
      const handles: HandleDef[] = [
        // corners (both dimensions free)
        { px: offX + b.minC       * cellSize, py: offY + b.minR       * cellSize, fixedR: b.maxR, fixedC: b.maxC, activeR: b.minR, activeC: b.minC, lockRow: false, lockCol: false, cursor: 'nwse-resize' },
        { px: offX + (b.maxC + 1) * cellSize, py: offY + b.minR       * cellSize, fixedR: b.maxR, fixedC: b.minC, activeR: b.minR, activeC: b.maxC, lockRow: false, lockCol: false, cursor: 'nesw-resize' },
        { px: offX + b.minC       * cellSize, py: offY + (b.maxR + 1) * cellSize, fixedR: b.minR, fixedC: b.maxC, activeR: b.maxR, activeC: b.minC, lockRow: false, lockCol: false, cursor: 'nesw-resize' },
        { px: offX + (b.maxC + 1) * cellSize, py: offY + (b.maxR + 1) * cellSize, fixedR: b.minR, fixedC: b.minC, activeR: b.maxR, activeC: b.maxC, lockRow: false, lockCol: false, cursor: 'nwse-resize' },
        // edges (one dimension locked)
        { px: midX,                            py: offY + b.minR       * cellSize, fixedR: b.maxR, fixedC: b.minC, activeR: b.minR, activeC: b.maxC, lockRow: false, lockCol: true,  cursor: 'ns-resize' },
        { px: midX,                            py: offY + (b.maxR + 1) * cellSize, fixedR: b.minR, fixedC: b.minC, activeR: b.maxR, activeC: b.maxC, lockRow: false, lockCol: true,  cursor: 'ns-resize' },
        { px: offX + b.minC       * cellSize,  py: midY,                           fixedR: b.minR, fixedC: b.maxC, activeR: b.maxR, activeC: b.minC, lockRow: true,  lockCol: false, cursor: 'ew-resize' },
        { px: offX + (b.maxC + 1) * cellSize,  py: midY,                           fixedR: b.minR, fixedC: b.minC, activeR: b.maxR, activeC: b.maxC, lockRow: true,  lockCol: false, cursor: 'ew-resize' },
      ];

      for (const h of handles) {
        const handle = document.createElement('div');
        handle.className        = 'group-resize-handle';
        handle.style.left       = `${h.px - HALF}px`;
        handle.style.top        = `${h.py - HALF}px`;
        handle.style.background = color;
        handle.style.cursor     = h.cursor;
        if (h.lockRow || h.lockCol) handle.style.borderRadius = '50%';
        handle.addEventListener('mousedown', (e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          this.startResize(group.id, h.fixedR, h.fixedC, h.activeR, h.activeC, h.lockRow, h.lockCol);
        });
        layer.appendChild(handle);
      }
    }
  }

  private startResize(groupId: string, fixedR: number, fixedC: number, activeR: number, activeC: number, lockRow = false, lockCol = false): void {
    this.isResizing     = true;
    this.resizeGroupId  = groupId;
    this.resizeFixedR   = fixedR;
    this.resizeFixedC   = fixedC;
    this.resizeCurrentR = activeR;
    this.resizeCurrentC = activeC;
    this.resizeLockRow  = lockRow;
    this.resizeLockCol  = lockCol;
    this.resizeSnapshot.clear();

    const grid = document.getElementById('garden-grid')!;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = grid.children[r * this.cols + c] as HTMLElement;
        if (cell.dataset['groupId'] === groupId) {
          this.resizeSnapshot.set(`${r},${c}`, {
            zone:    cell.dataset['zone'],
            color:   cell.dataset['customColor'],
            groupId: cell.dataset['groupId'],
          });
        }
      }
    }
  }

  private updateResizeBox(newR: number, newC: number): void {
    const grid   = document.getElementById('garden-grid')!;
    const cols   = this.cols;
    const fixedR = this.resizeFixedR;
    const fixedC = this.resizeFixedC;

    const oldMinR = Math.min(fixedR, this.resizeCurrentR);
    const oldMaxR = Math.max(fixedR, this.resizeCurrentR);
    const oldMinC = Math.min(fixedC, this.resizeCurrentC);
    const oldMaxC = Math.max(fixedC, this.resizeCurrentC);

    const newMinR = Math.min(fixedR, newR);
    const newMaxR = Math.max(fixedR, newR);
    const newMinC = Math.min(fixedC, newC);
    const newMaxC = Math.max(fixedC, newC);

    const inNew = (r: number, c: number) =>
      r >= newMinR && r <= newMaxR && c >= newMinC && c <= newMaxC;

    for (let r = oldMinR; r <= oldMaxR; r++) {
      for (let c = oldMinC; c <= oldMaxC; c++) {
        if (!inNew(r, c)) this.restoreResizeCell(grid, r, c, cols);
      }
    }

    const plantColor = PLANT_MAP[this.groups.find(g => g.id === this.resizeGroupId)!.plant]?.color;

    for (let r = newMinR; r <= newMaxR; r++) {
      for (let c = newMinC; c <= newMaxC; c++) {
        const key  = `${r},${c}`;
        const cell = grid.children[r * cols + c] as HTMLElement;
        if (!cell) continue;
        if (!this.resizeSnapshot.has(key)) {
          this.resizeSnapshot.set(key, { zone: cell.dataset['zone'], color: cell.dataset['customColor'], groupId: cell.dataset['groupId'] });
        }
        if (plantColor) {
          cell.style.background       = plantColor;
          cell.dataset['zone']        = 'custom';
          cell.dataset['customColor'] = plantColor;
        }
        cell.dataset['groupId'] = this.resizeGroupId;
      }
    }

    this.resizeCurrentR = newR;
    this.resizeCurrentC = newC;
    this.applyGroupBorders();
    this.applyGroupHandles();
  }

  private restoreResizeCell(grid: HTMLElement, r: number, c: number, cols: number): void {
    const cell = grid.children[r * cols + c] as HTMLElement;
    if (!cell) return;
    const snap = this.resizeSnapshot.get(`${r},${c}`);

    // Cell was originally part of this group — shrinking removes it entirely
    if (!snap || snap.groupId === this.resizeGroupId) {
      delete cell.dataset['zone'];
      delete cell.dataset['customColor'];
      delete cell.dataset['groupId'];
      cell.style.background = '';
      cell.style.boxShadow  = '';
      return;
    }

    // Cell was outside the group — restore its pre-resize state
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
  }

  // ─── Group move ──────────────────────────────────────────────────────────────
  private startMove(groupId: string, anchorR: number, anchorC: number): void {
    this.isMoving         = true;
    this.moveGroupId      = groupId;
    this.moveAnchorR      = anchorR;
    this.moveAnchorC      = anchorC;
    this.moveDeltaR       = 0;
    this.moveDeltaC       = 0;
    this.moveOriginalCells = [];
    this.moveSnapshot.clear();

    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    const grid = document.getElementById('garden-grid')!;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = grid.children[r * this.cols + c] as HTMLElement;
        if (cell.dataset['groupId'] !== groupId) continue;
        this.moveOriginalCells.push({ r, c });
        this.moveSnapshot.set(`${r},${c}`, {
          zone:    cell.dataset['zone'],
          color:   cell.dataset['customColor'],
          groupId: cell.dataset['groupId'],
        });
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }

    this.moveBoundsMinR = minR;
    this.moveBoundsMaxR = maxR;
    this.moveBoundsMinC = minC;
    this.moveBoundsMaxC = maxC;
  }

  private updateMovePosition(newDeltaR: number, newDeltaC: number): void {
    const grid = document.getElementById('garden-grid')!;
    const cols = this.cols;

    const oldPositions = new Set(
      this.moveOriginalCells.map(({ r, c }) => `${r + this.moveDeltaR},${c + this.moveDeltaC}`)
    );
    const newPositions = new Set(
      this.moveOriginalCells.map(({ r, c }) => `${r + newDeltaR},${c + newDeltaC}`)
    );

    // Detect conflict before modifying the DOM: check cells the group is newly entering
    let hasConflict = false;
    for (const { r: origR, c: origC } of this.moveOriginalCells) {
      const key = `${origR + newDeltaR},${origC + newDeltaC}`;
      if (oldPositions.has(key)) continue;
      const cell = grid.children[(origR + newDeltaR) * cols + (origC + newDeltaC)] as HTMLElement;
      const gid  = cell?.dataset['groupId'];
      if (gid && gid !== this.moveGroupId) { hasConflict = true; break; }
    }
    this.moveHasConflict = hasConflict;

    for (const key of oldPositions) {
      if (!newPositions.has(key)) {
        const [r, c] = key.split(',').map(Number);
        this.restoreMoveCell(grid, r, c, cols);
      }
    }

    const plantColor = PLANT_MAP[this.groups.find(g => g.id === this.moveGroupId)!.plant]?.color;

    for (const { r: origR, c: origC } of this.moveOriginalCells) {
      const r   = origR + newDeltaR;
      const c   = origC + newDeltaC;
      const key = `${r},${c}`;
      if (!oldPositions.has(key) && !this.moveSnapshot.has(key)) {
        const snapCell = grid.children[r * cols + c] as HTMLElement;
        if (snapCell) {
          this.moveSnapshot.set(key, {
            zone:    snapCell.dataset['zone'],
            color:   snapCell.dataset['customColor'],
            groupId: snapCell.dataset['groupId'],
          });
        }
      }
      const cell = grid.children[r * cols + c] as HTMLElement;
      if (!cell) continue;
      if (plantColor) {
        cell.style.background       = plantColor;
        cell.dataset['zone']        = 'custom';
        cell.dataset['customColor'] = plantColor;
      }
      cell.dataset['groupId'] = this.moveGroupId;
      cell.style.filter       = hasConflict ? 'brightness(0.45)' : '';
    }

    this.moveDeltaR = newDeltaR;
    this.moveDeltaC = newDeltaC;
    this.applyGroupBorders();
    this.applyGroupHandles();
  }

  // ─── Group context menu ──────────────────────────────────────────────────────
  private showContextMenu(x: number, y: number, groupId: string | null): void {
    this.closeContextMenu();

    const menu = document.createElement('div');
    menu.className  = 'context-menu';
    menu.style.left = `${x}px`;
    menu.style.top  = `${y}px`;

    // ── Plan-level items ──────────────────────────────────────────────────────
    const notesItem = document.createElement('div');
    notesItem.className   = 'context-menu-item';
    notesItem.textContent = 'Edit Plan Notes…';
    notesItem.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.closeContextMenu();
      this.showEditPlanNotesDialog();
    });
    menu.appendChild(notesItem);

    // ── Separator ─────────────────────────────────────────────────────────────
    const sep = document.createElement('div');
    sep.className = 'context-menu-separator';
    menu.appendChild(sep);

    // ── Group-level items (disabled when no group) ────────────────────────────
    const editItem = document.createElement('div');
    editItem.className   = `context-menu-item${groupId ? '' : ' disabled'}`;
    editItem.textContent = 'Edit Group…';
    if (groupId) {
      editItem.addEventListener('mousedown', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        this.closeContextMenu();
        this.showEditGroupDialog(groupId);
      });
    }
    menu.appendChild(editItem);

    const deleteItem = document.createElement('div');
    deleteItem.className   = `context-menu-item danger${groupId ? '' : ' disabled'}`;
    deleteItem.textContent = 'Delete Group…';
    if (groupId) {
      deleteItem.addEventListener('mousedown', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        this.closeContextMenu();
        this.showDeleteGroupConfirmation(groupId);
      });
    }
    menu.appendChild(deleteItem);

    document.body.appendChild(menu);
    this.contextMenu = menu;

    const rect = menu.getBoundingClientRect();
    if (rect.right  > window.innerWidth)  menu.style.left = `${x - rect.width}px`;
    if (rect.bottom > window.innerHeight) menu.style.top  = `${y - rect.height}px`;
  }

  private showEditPlanNotesDialog(): void {
    let pending = this.planNotes;

    this.dialogService.createDialog()
      .setTitle('Plan Notes')
      .setDialogContent(EditPlanNotesComponent, {
        notes:    this.planNotes,
        onChange: (v: string) => { pending = v; },
      })
      .setWidth('400px')
      .addAction('Cancel')
      .addAction('Save', () => {
        this.planNotes = pending;
        this.notifyChange();
      })
      .open();
  }

  private showEditGroupDialog(groupId: string): void {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return;

    const plantLabel = group.plant.charAt(0).toUpperCase() + group.plant.slice(1);
    const pending: EditGroupData = { plant: group.plant, subtype: group.subtype, notes: group.notes };

    this.dialogService.createDialog()
      .setTitle(`Edit ${plantLabel} Group`)
      .setDialogContent(EditGroupComponent, {
        plant:    group.plant,
        subtype:  group.subtype ?? '',
        notes:    group.notes   ?? '',
        onChange: (data: EditGroupData) => Object.assign(pending, data),
      })
      .setWidth('360px')
      .addAction('Cancel')
      .addAction('Save', () => {
        const plantChanged = pending.plant && pending.plant !== group.plant;
        group.notes   = pending.notes;
        group.subtype = pending.subtype;
        if (plantChanged && pending.plant) {
          group.plant = pending.plant;
          this.repaintGroupCells(groupId, pending.plant);
        }
        this.notifyChange();
      })
      .open();
  }

  private repaintGroupCells(groupId: string, plant: string): void {
    const color = PLANT_MAP[plant]?.color;
    if (!color) return;
    const grid = document.getElementById('garden-grid')!;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = grid.children[r * this.cols + c] as HTMLElement;
        if (cell.dataset['groupId'] !== groupId) continue;
        cell.style.background       = color;
        cell.dataset['zone']        = 'custom';
        cell.dataset['customColor'] = color;
      }
    }
  }

  private showDeleteGroupConfirmation(groupId: string): void {
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return;

    const plantLabel = group.plant.charAt(0).toUpperCase() + group.plant.slice(1);

    this.dialogService.createDialog()
      .setTitle('Delete Group')
      .setDialogContent(`Remove this ${plantLabel} group and all its planted cells? This cannot be undone.`)
      .addAction('Cancel')
      .addAction('Delete', () => this.deleteGroup(groupId))
      .open();
  }

  private closeContextMenu(): void {
    this.contextMenu?.remove();
    this.contextMenu = null;
  }

  private deleteGroup(groupId: string): void {
    const grid = document.getElementById('garden-grid')!;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = grid.children[r * this.cols + c] as HTMLElement;
        if (cell.dataset['groupId'] !== groupId) continue;
        delete cell.dataset['zone'];
        delete cell.dataset['customColor'];
        delete cell.dataset['groupId'];
        cell.style.background = '';
        cell.style.boxShadow  = '';
      }
    }
    this.notifyChange();
  }

  private restoreMoveCell(grid: HTMLElement, r: number, c: number, cols: number): void {
    const cell = grid.children[r * cols + c] as HTMLElement;
    if (!cell) return;
    const snap = this.moveSnapshot.get(`${r},${c}`);

    cell.style.filter = '';

    if (!snap || snap.groupId === this.moveGroupId) {
      delete cell.dataset['zone'];
      delete cell.dataset['customColor'];
      delete cell.dataset['groupId'];
      cell.style.background = '';
      cell.style.boxShadow  = '';
      return;
    }

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
  }
}
