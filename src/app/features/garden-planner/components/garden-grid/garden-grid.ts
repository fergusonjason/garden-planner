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

type CellSnap   = { zone: string | undefined; color: string | undefined; groupId: string | undefined };
type GroupBounds = { minR: number; maxR: number; minC: number; maxC: number };


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

  // ─── Garden state ────────────────────────────────────────────────────────────
  private cols      = 40;
  private rows      = 40;
  private cells:    GardenCellData[] = [];
  private groups:   PlantGroup[]     = [];
  private planNotes = '';

  // ─── Cached DOM refs ─────────────────────────────────────────────────────────
  private cellEls:      HTMLElement[] = [];
  private gridEl:       HTMLElement | null = null;
  private labelsLayer:  HTMLElement | null = null;
  private handlesLayer: HTMLElement | null = null;
  private cellSize      = 0;

  // ─── Interaction state ───────────────────────────────────────────────────────
  private isPainting      = false;
  private hoveredGroupId: string | null = null;
  private contextMenu:    HTMLElement | null = null;
  private tooltipEl:       HTMLElement | null = null;
  private resizeTooltipEl: HTMLElement | null = null;
  private gridMouseMoveListener: ((e: MouseEvent) => void) | null = null;

  // Box drawing state (ctrl+drag)
  private isBoxDrawing = false;
  private boxStartRow  = 0;
  private boxStartCol  = 0;
  private boxEndRow    = 0;
  private boxEndCol    = 0;
  private boxSnapshot  = new Map<string, CellSnap>();

  // Group resize state
  private isResizing     = false;
  private resizeGroupId  = '';
  private resizeFixedR   = 0;
  private resizeFixedC   = 0;
  private resizeCurrentR = 0;
  private resizeCurrentC = 0;
  private resizeLockRow  = false;
  private resizeLockCol  = false;
  private resizeSnapshot = new Map<string, CellSnap>();

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
  private moveSnapshot      = new Map<string, CellSnap>();
  private moveHasConflict   = false;

  // Undo / redo
  private readonly MAX_HISTORY = 50;
  private undoStack: GardenGridValue[] = [];
  private redoStack: GardenGridValue[] = [];

  // ─── Static lookups ──────────────────────────────────────────────────────────
  private static readonly GROUP_COLORS = [
    '#ffd740', '#40c4ff', '#ff4081', '#69f0ae',
    '#ff6d00', '#e040fb', '#ccff90', '#ff6e40',
  ];

  private static readonly COLOR_TO_PLANT = new Map<string, string>(
    Object.entries(PLANT_MAP).map(([k, v]) => [v.color, k])
  );

  // ─── Event handlers ──────────────────────────────────────────────────────────
  private readonly resizeMoveHandler = (e: MouseEvent) => {
    if (!this.isResizing) return;
    const rect = this.gridEl!.getBoundingClientRect();
    let c = Math.floor((e.clientX - rect.left) / this.cellSize);
    let r = Math.floor((e.clientY - rect.top)  / this.cellSize);
    c = Math.max(0, Math.min(this.cols - 1, c));
    r = Math.max(0, Math.min(this.rows - 1, r));
    if (this.resizeLockRow) r = this.resizeCurrentR;
    if (this.resizeLockCol) c = this.resizeCurrentC;
    if (r === this.resizeCurrentR && c === this.resizeCurrentC) return;
    this.updateResizeBox(r, c);
    const w = Math.abs(c - this.resizeFixedC) + 1;
    const h = Math.abs(r - this.resizeFixedR) + 1;
    this.showResizeTooltip(e.clientX, e.clientY, w, h);
  };

  private readonly contextMenuCloseHandler = (e: MouseEvent) => {
    if (this.contextMenu && !this.contextMenu.contains(e.target as Node)) {
      this.closeContextMenu();
    }
  };

  private readonly contextMenuKeyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { this.closeContextMenu(); return; }
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      this.closeContextMenu();
      this.undo();
    } else if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      this.closeContextMenu();
      this.redo();
    }
  };

  private readonly moveDragHandler = (e: MouseEvent) => {
    if (!this.isMoving) return;
    const rect = this.gridEl!.getBoundingClientRect();
    let c = Math.floor((e.clientX - rect.left) / this.cellSize);
    let r = Math.floor((e.clientY - rect.top)  / this.cellSize);
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
      this.hideResizeTooltip();
      return;
    }
    if (this.isPainting) {
      if (this.isBoxDrawing) {
        this.commitBox();
        this.hideResizeTooltip();
      }
      this.notifyChange();
    }
    this.isPainting   = false;
    this.isBoxDrawing = false;
    this.boxSnapshot.clear();
  };

  // ─── Lifecycle ───────────────────────────────────────────────────────────────
  ngAfterViewInit(): void {
    this.gridEl       = document.getElementById('garden-grid')!;
    this.labelsLayer  = document.getElementById('group-labels-layer')!;
    this.handlesLayer = document.getElementById('group-handles-layer')!;

    document.addEventListener('mouseup',   this.mouseUpListener);
    document.addEventListener('mousemove', this.resizeMoveHandler);
    document.addEventListener('mousemove', this.moveDragHandler);
    document.addEventListener('mousedown', this.contextMenuCloseHandler);
    document.addEventListener('keydown',   this.contextMenuKeyHandler);

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
    this.hideGroupTooltip();

    const grid   = this.gridEl!;
    const rulerX = document.getElementById('ruler-x')!;
    const rulerY = document.getElementById('ruler-y')!;

    if (this.gridMouseMoveListener) {
      grid.removeEventListener('mousemove', this.gridMouseMoveListener);
      this.gridMouseMoveListener = null;
    }

    this.cellSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-size'));

    grid.innerHTML   = '';
    rulerX.innerHTML = '';
    rulerY.innerHTML = '';

    const cols = this.cols;
    const rows = this.rows;

    grid.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
    grid.style.gridTemplateRows    = `repeat(${rows}, var(--cell-size))`;

    for (let c = 0; c < cols; c++) {
      const d = document.createElement('div');
      d.className   = 'ruler-cell' + ((c + 1) % 5 === 0 ? ' labeled' : '');
      d.textContent = (c + 1) % 5 === 0 ? String(c + 1) : '';
      rulerX.appendChild(d);
    }
    for (let r = 0; r < rows; r++) {
      const d = document.createElement('div');
      d.className   = 'ruler-cell' + ((r + 1) % 5 === 0 ? ' labeled' : '');
      d.textContent = (r + 1) % 5 === 0 ? String(r + 1) : '';
      rulerY.appendChild(d);
    }

    this.cellEls = [];
    const frag   = document.createDocumentFragment();

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
              if (gid) {
                const group = this.groups.find(g => g.id === gid);
                if (group) this.showGroupTooltip(group, e.clientX, e.clientY);
                else       this.hideGroupTooltip();
              } else {
                this.hideGroupTooltip();
              }
            }
          }
          if (!this.isPainting) return;
          if (this.isBoxDrawing) return;
          if (e.shiftKey) { this.eraseCell(cell); return; }
          this.paintCell(cell);
        });

        cell.addEventListener('contextmenu', (e: MouseEvent) => {
          e.preventDefault();
          this.showContextMenu(e.clientX, e.clientY, cell.dataset['groupId'] ?? null);
        });

        cell.addEventListener('mousedown', (e: MouseEvent) => {
          e.preventDefault();
          if (e.button === 2) return;
          this.captureSnapshot();
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

        this.cellEls.push(cell);
        frag.appendChild(cell);
      }
    }

    grid.appendChild(frag);

    this.gridMouseMoveListener = (e: MouseEvent) => {
      if (this.tooltipEl) {
        this.tooltipEl.style.left = `${e.clientX + 14}px`;
        this.tooltipEl.style.top  = `${e.clientY + 14}px`;
      }
      if (!this.isPainting || !this.isBoxDrawing) return;
      const rect = grid.getBoundingClientRect();
      let c = Math.floor((e.clientX - rect.left) / this.cellSize);
      let r = Math.floor((e.clientY - rect.top)  / this.cellSize);
      c = Math.max(0, Math.min(cols - 1, c));
      r = Math.max(0, Math.min(rows - 1, r));
      this.updateBox(r, c);
      this.boxEndRow = r;
      this.boxEndCol = c;
      const w = Math.abs(c - this.boxStartCol) + 1;
      const h = Math.abs(r - this.boxStartRow) + 1;
      this.showResizeTooltip(e.clientX, e.clientY, w, h);
    };
    grid.addEventListener('mousemove', this.gridMouseMoveListener);
    grid.addEventListener('mouseleave', () => {
      this.hideGroupTooltip();
      if (!this.isResizing && !this.isMoving && this.hoveredGroupId !== null) {
        this.hoveredGroupId = null;
        this.applyGroupHandles();
      }
    });

    this.paintedCount.set(0);
    this.paintedCountChange.emit(0);
  }

  private applyStoredCells(): void {
    let count = 0;
    for (const { x, y, plant, groupId } of this.cells) {
      if (x >= this.cols || y >= this.rows) continue;
      const cell = this.cellEls[y * this.cols + x];
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

  // ─── Group rendering (single-pass bounds) ───────────────────────────────────
  private applyGroupBorders(): void {
    const cols = this.cols;
    const rows = this.rows;

    const colorMap = new Map<string, string>();
    this.groups.forEach((g, i) => colorMap.set(g.id, GardenGrid.GROUP_COLORS[i % GardenGrid.GROUP_COLORS.length]));

    const allBounds = new Map<string, GroupBounds>();

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell    = this.cellEls[r * cols + c];
        const groupId = cell.dataset['groupId'];

        if (!groupId || !colorMap.has(groupId)) {
          cell.style.boxShadow = '';
          continue;
        }

        let b = allBounds.get(groupId);
        if (!b) { b = { minR: r, maxR: r, minC: c, maxC: c }; allBounds.set(groupId, b); }
        else    { if (r > b.maxR) b.maxR = r; if (c < b.minC) b.minC = c; if (c > b.maxC) b.maxC = c; }

        const color   = colorMap.get(groupId)!;
        const aboveId = r > 0        ? this.cellEls[(r - 1) * cols + c].dataset['groupId'] : undefined;
        const belowId = r < rows - 1 ? this.cellEls[(r + 1) * cols + c].dataset['groupId'] : undefined;
        const leftId  = c > 0        ? this.cellEls[r * cols + (c - 1)].dataset['groupId'] : undefined;
        const rightId = c < cols - 1 ? this.cellEls[r * cols + (c + 1)].dataset['groupId'] : undefined;

        const shadows: string[] = [];
        if (aboveId !== groupId) shadows.push(`inset 0  2px 0 0 ${color}`);
        if (belowId !== groupId) shadows.push(`inset 0 -2px 0 0 ${color}`);
        if (leftId  !== groupId) shadows.push(`inset  2px 0 0 0 ${color}`);
        if (rightId !== groupId) shadows.push(`inset -2px 0 0 0 ${color}`);
        cell.style.boxShadow = shadows.join(', ');
      }
    }

    this.applyGroupLabels(allBounds);
    this.applyGroupHandles(allBounds);
  }

  private static relativeLuminance(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const lin = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }

  private applyGroupLabels(allBounds: Map<string, GroupBounds>): void {
    const layer = this.labelsLayer;
    if (!layer) return;

    layer.innerHTML = '';

    const gridRect  = this.gridEl!.getBoundingClientRect();
    const layerRect = layer.parentElement!.getBoundingClientRect();
    const offX      = gridRect.left - layerRect.left;
    const offY      = gridRect.top  - layerRect.top;
    const cs        = this.cellSize;

    for (const group of this.groups) {
      const b = allBounds.get(group.id);
      if (!b) continue;

      const widthCells  = b.maxC - b.minC + 1;
      const heightCells = b.maxR - b.minR + 1;
      const plantLabel  = group.plant.charAt(0).toUpperCase() + group.plant.slice(1);
      const text        = group.subtype ? `${plantLabel} · ${group.subtype}` : plantLabel;
      const plantColor  = PLANT_MAP[group.plant]?.color ?? '#000000';
      const lightBg     = GardenGrid.relativeLuminance(plantColor) > 0.35;

      const el = document.createElement('div');
      el.className        = 'group-label';
      el.textContent      = text;
      el.style.left       = `${offX + b.minC * cs}px`;
      el.style.top        = `${offY + b.minR * cs}px`;
      el.style.width      = `${widthCells  * cs}px`;
      el.style.height     = `${heightCells * cs}px`;
      el.style.color      = lightBg ? 'rgba(26,18,9,0.85)'  : 'rgba(255,255,255,0.85)';
      el.style.textShadow = lightBg ? 'none'                 : '0 1px 3px rgba(0,0,0,0.9)';
      if (heightCells > widthCells) {
        el.style.writingMode = 'vertical-lr';
        el.style.transform   = 'rotate(180deg)';
      }
      layer.appendChild(el);
    }
  }

  // ─── Paint ──────────────────────────────────────────────────────────────────
  private paintCell(cell: HTMLElement): void {
    const selected = this.selectedPlant();
    if (selected.currentZone === 'erase') { this.eraseCell(cell); return; }
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

  private updateBox(newEndR: number, newEndC: number): void {
    const cols   = this.cols;
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
        if (!inNew(r, c)) this.restoreBoxCell(this.cellEls[r * cols + c], r, c);
      }
    }
    for (let r = newMinR; r <= newMaxR; r++) {
      for (let c = newMinC; c <= newMaxC; c++) {
        const key  = `${r},${c}`;
        const cell = this.cellEls[r * cols + c];
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
    const cols    = this.cols;
    const groupId = crypto.randomUUID();
    const minR = Math.min(this.boxStartRow, this.boxEndRow);
    const maxR = Math.max(this.boxStartRow, this.boxEndRow);
    const minC = Math.min(this.boxStartCol, this.boxEndCol);
    const maxC = Math.max(this.boxStartCol, this.boxEndCol);

    this.groups.push({ id: groupId, plant: this.selectedPlant().plant.key });
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const cell = this.cellEls[r * cols + c];
        if (cell) cell.dataset['groupId'] = groupId;
      }
    }
  }

  // Syncs DOM → gridControl without re-triggering valueChanges
  private notifyChange(): void {
    const cells: GardenCellData[] = [];
    const activeGroupIds          = new Set<string>();
    const n                       = this.rows * this.cols;

    for (let i = 0; i < n; i++) {
      const cell    = this.cellEls[i];
      const custom  = cell.dataset['customColor'];
      const zone    = cell.dataset['zone'];
      const groupId = cell.dataset['groupId'];
      if (!custom && !zone) continue;
      const x     = i % this.cols;
      const y     = Math.floor(i / this.cols);
      const plant = custom ? (GardenGrid.COLOR_TO_PLANT.get(custom) ?? 'unknown') : zone!;
      const cellData: GardenCellData = { x, y, plant };
      if (groupId) { cellData.groupId = groupId; activeGroupIds.add(groupId); }
      cells.push(cellData);
    }

    this.groups = this.groups.filter(g => activeGroupIds.has(g.id));
    this.cells  = cells;
    const count = cells.length;
    this.paintedCount.set(count);
    this.paintedCountChange.emit(count);
    this.gardenGroup.setValue({ cols: this.cols, rows: this.rows, cells, groups: this.groups, notes: this.planNotes }, { emitEvent: false });
    this.gardenGroup.markAsTouched();
    this.applyGroupBorders();
  }

  // ─── Group resize ────────────────────────────────────────────────────────────
  private applyGroupHandles(allBounds?: Map<string, GroupBounds>): void {
    const layer = this.handlesLayer;
    if (!layer) return;

    layer.innerHTML = '';

    const targetId = this.isResizing ? this.resizeGroupId
                   : this.isMoving   ? this.moveGroupId
                   : this.hoveredGroupId;
    if (!targetId) return;

    const group = this.groups.find(g => g.id === targetId);
    if (!group) return;

    const cs        = this.cellSize;
    const layerRect = layer.parentElement!.getBoundingClientRect();
    const gridRect  = this.gridEl!.getBoundingClientRect();
    const offX      = gridRect.left - layerRect.left;
    const offY      = gridRect.top  - layerRect.top;
    const groupIndex = this.groups.indexOf(group);

    let b: GroupBounds | undefined = allBounds?.get(targetId);
    if (!b) {
      const cols = this.cols;
      const rows = this.rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (this.cellEls[r * cols + c].dataset['groupId'] !== targetId) continue;
          if (!b) b = { minR: r, maxR: r, minC: c, maxC: c };
          else    { if (r > b.maxR) b.maxR = r; if (c < b.minC) b.minC = c; if (c > b.maxC) b.maxC = c; }
        }
      }
    }
    if (!b) return;

    const color = GardenGrid.GROUP_COLORS[groupIndex % GardenGrid.GROUP_COLORS.length];
    const midX  = offX + (b.minC + b.maxC + 1) / 2 * cs;
    const midY  = offY + (b.minR + b.maxR + 1) / 2 * cs;
    const H = 8, HALF = H / 2;

    type HandleDef = { px: number; py: number; fixedR: number; fixedC: number; activeR: number; activeC: number; lockRow: boolean; lockCol: boolean; cursor: string };
    const handles: HandleDef[] = [
      { px: offX + b.minC       * cs, py: offY + b.minR       * cs, fixedR: b.maxR, fixedC: b.maxC, activeR: b.minR, activeC: b.minC, lockRow: false, lockCol: false, cursor: 'nwse-resize' },
      { px: offX + (b.maxC + 1) * cs, py: offY + b.minR       * cs, fixedR: b.maxR, fixedC: b.minC, activeR: b.minR, activeC: b.maxC, lockRow: false, lockCol: false, cursor: 'nesw-resize' },
      { px: offX + b.minC       * cs, py: offY + (b.maxR + 1) * cs, fixedR: b.minR, fixedC: b.maxC, activeR: b.maxR, activeC: b.minC, lockRow: false, lockCol: false, cursor: 'nesw-resize' },
      { px: offX + (b.maxC + 1) * cs, py: offY + (b.maxR + 1) * cs, fixedR: b.minR, fixedC: b.minC, activeR: b.maxR, activeC: b.maxC, lockRow: false, lockCol: false, cursor: 'nwse-resize' },
      { px: midX,                      py: offY + b.minR       * cs, fixedR: b.maxR, fixedC: b.minC, activeR: b.minR, activeC: b.maxC, lockRow: false, lockCol: true,  cursor: 'ns-resize'   },
      { px: midX,                      py: offY + (b.maxR + 1) * cs, fixedR: b.minR, fixedC: b.minC, activeR: b.maxR, activeC: b.maxC, lockRow: false, lockCol: true,  cursor: 'ns-resize'   },
      { px: offX + b.minC       * cs,  py: midY,                     fixedR: b.minR, fixedC: b.maxC, activeR: b.maxR, activeC: b.minC, lockRow: true,  lockCol: false, cursor: 'ew-resize'   },
      { px: offX + (b.maxC + 1) * cs,  py: midY,                     fixedR: b.minR, fixedC: b.minC, activeR: b.maxR, activeC: b.maxC, lockRow: true,  lockCol: false, cursor: 'ew-resize'   },
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
        this.captureSnapshot();
        this.startResize(group.id, h.fixedR, h.fixedC, h.activeR, h.activeC, h.lockRow, h.lockCol);
      });
      layer.appendChild(handle);
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

    const n = this.rows * this.cols;
    for (let i = 0; i < n; i++) {
      const cell = this.cellEls[i];
      if (cell.dataset['groupId'] !== groupId) continue;
      const r = Math.floor(i / this.cols);
      const c = i % this.cols;
      this.resizeSnapshot.set(`${r},${c}`, { zone: cell.dataset['zone'], color: cell.dataset['customColor'], groupId: cell.dataset['groupId'] });
    }
  }

  private updateResizeBox(newR: number, newC: number): void {
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
        if (!inNew(r, c)) this.restoreResizeCell(r, c, cols);
      }
    }

    const plantColor = PLANT_MAP[this.groups.find(g => g.id === this.resizeGroupId)!.plant]?.color;

    for (let r = newMinR; r <= newMaxR; r++) {
      for (let c = newMinC; c <= newMaxC; c++) {
        const key  = `${r},${c}`;
        const cell = this.cellEls[r * cols + c];
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
  }

  private restoreResizeCell(r: number, c: number, cols: number): void {
    const cell = this.cellEls[r * cols + c];
    if (!cell) return;
    const snap = this.resizeSnapshot.get(`${r},${c}`);

    if (!snap || snap.groupId === this.resizeGroupId) {
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

  // ─── Group move ──────────────────────────────────────────────────────────────
  private startMove(groupId: string, anchorR: number, anchorC: number): void {
    this.isMoving          = true;
    this.moveGroupId       = groupId;
    this.moveAnchorR       = anchorR;
    this.moveAnchorC       = anchorC;
    this.moveDeltaR        = 0;
    this.moveDeltaC        = 0;
    this.moveOriginalCells = [];
    this.moveSnapshot.clear();

    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    const n = this.rows * this.cols;

    for (let i = 0; i < n; i++) {
      const cell = this.cellEls[i];
      if (cell.dataset['groupId'] !== groupId) continue;
      const r = Math.floor(i / this.cols);
      const c = i % this.cols;
      this.moveOriginalCells.push({ r, c });
      this.moveSnapshot.set(`${r},${c}`, { zone: cell.dataset['zone'], color: cell.dataset['customColor'], groupId: cell.dataset['groupId'] });
      if (r < minR) minR = r;
      if (r > maxR) maxR = r;
      if (c < minC) minC = c;
      if (c > maxC) maxC = c;
    }

    this.moveBoundsMinR = minR;
    this.moveBoundsMaxR = maxR;
    this.moveBoundsMinC = minC;
    this.moveBoundsMaxC = maxC;
  }

  private updateMovePosition(newDeltaR: number, newDeltaC: number): void {
    const cols = this.cols;

    const oldPositions = new Set(this.moveOriginalCells.map(({ r, c }) => `${r + this.moveDeltaR},${c + this.moveDeltaC}`));
    const newPositions = new Set(this.moveOriginalCells.map(({ r, c }) => `${r + newDeltaR},${c + newDeltaC}`));

    let hasConflict = false;
    for (const { r: origR, c: origC } of this.moveOriginalCells) {
      const key = `${origR + newDeltaR},${origC + newDeltaC}`;
      if (oldPositions.has(key)) continue;
      const gid = this.cellEls[(origR + newDeltaR) * cols + (origC + newDeltaC)]?.dataset['groupId'];
      if (gid && gid !== this.moveGroupId) { hasConflict = true; break; }
    }
    this.moveHasConflict = hasConflict;

    for (const key of oldPositions) {
      if (!newPositions.has(key)) {
        const [r, c] = key.split(',').map(Number);
        this.restoreMoveCell(r, c, cols);
      }
    }

    const plantColor = PLANT_MAP[this.groups.find(g => g.id === this.moveGroupId)!.plant]?.color;

    for (const { r: origR, c: origC } of this.moveOriginalCells) {
      const r   = origR + newDeltaR;
      const c   = origC + newDeltaC;
      const key = `${r},${c}`;
      if (!oldPositions.has(key) && !this.moveSnapshot.has(key)) {
        const snapCell = this.cellEls[r * cols + c];
        if (snapCell) this.moveSnapshot.set(key, { zone: snapCell.dataset['zone'], color: snapCell.dataset['customColor'], groupId: snapCell.dataset['groupId'] });
      }
      const cell = this.cellEls[r * cols + c];
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
  }

  // ─── Group context menu ──────────────────────────────────────────────────────
  private showContextMenu(x: number, y: number, groupId: string | null): void {
    this.closeContextMenu();

    const menu = document.createElement('div');
    menu.className  = 'context-menu';
    menu.style.left = `${x}px`;
    menu.style.top  = `${y}px`;

    const makeShortcutItem = (label: string, shortcut: string, disabled: boolean, action: () => void) => {
      const item = document.createElement('div');
      item.className = `context-menu-item${disabled ? ' disabled' : ''}`;
      const labelSpan = document.createElement('span');
      labelSpan.textContent = label;
      const kbdSpan = document.createElement('span');
      kbdSpan.className   = 'context-menu-shortcut';
      kbdSpan.textContent = shortcut;
      item.appendChild(labelSpan);
      item.appendChild(kbdSpan);
      if (!disabled) {
        item.addEventListener('mousedown', (e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          this.closeContextMenu();
          action();
        });
      }
      return item;
    };

    menu.appendChild(makeShortcutItem('Undo', 'Ctrl+Z', !this.undoStack.length, () => this.undo()));
    menu.appendChild(makeShortcutItem('Redo', 'Ctrl+Y', !this.redoStack.length, () => this.redo()));

    const sep0 = document.createElement('div');
    sep0.className = 'context-menu-separator';
    menu.appendChild(sep0);

    const notesItem = document.createElement('div');
    notesItem.className   = 'context-menu-item';
    notesItem.textContent = 'Edit Garden Plan Details';
    notesItem.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      this.closeContextMenu();
      this.showEditPlanNotesDialog();
    });
    menu.appendChild(notesItem);

    const sep = document.createElement('div');
    sep.className = 'context-menu-separator';
    menu.appendChild(sep);

    const editItem = document.createElement('div');
    editItem.className   = `context-menu-item${groupId ? '' : ' disabled'}`;
    editItem.textContent = 'Edit Planting Group';
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
    deleteItem.textContent = 'Delete Planting Group';
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
        this.captureSnapshot();
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
        this.captureSnapshot();
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
    const n = this.rows * this.cols;
    for (let i = 0; i < n; i++) {
      const cell = this.cellEls[i];
      if (cell.dataset['groupId'] !== groupId) continue;
      cell.style.background       = color;
      cell.dataset['zone']        = 'custom';
      cell.dataset['customColor'] = color;
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

  // ─── Group tooltip ───────────────────────────────────────────────────────────
  private showGroupTooltip(group: PlantGroup, x: number, y: number): void {
    this.hideGroupTooltip();
    const el = document.createElement('div');
    el.className = 'group-tooltip';
    const plantLabel = group.plant.charAt(0).toUpperCase() + group.plant.slice(1);
    el.textContent   = group.subtype ? `${plantLabel} · ${group.subtype}` : plantLabel;
    el.style.left    = `${x + 14}px`;
    el.style.top     = `${y + 14}px`;
    document.body.appendChild(el);
    this.tooltipEl = el;
    const rect = el.getBoundingClientRect();
    if (rect.right  > window.innerWidth)  el.style.left = `${x - rect.width  - 6}px`;
    if (rect.bottom > window.innerHeight) el.style.top  = `${y - rect.height - 6}px`;
  }

  private hideGroupTooltip(): void {
    this.tooltipEl?.remove();
    this.tooltipEl = null;
  }

  private showResizeTooltip(x: number, y: number, w: number, h: number): void {
    if (!this.resizeTooltipEl) {
      this.resizeTooltipEl = document.createElement('div');
      this.resizeTooltipEl.className = 'group-tooltip';
      document.body.appendChild(this.resizeTooltipEl);
    }
    this.resizeTooltipEl.textContent = `${w} ft × ${h} ft · ${w * h} sq ft`;
    this.resizeTooltipEl.style.left  = `${x + 14}px`;
    this.resizeTooltipEl.style.top   = `${y + 14}px`;
  }

  private hideResizeTooltip(): void {
    this.resizeTooltipEl?.remove();
    this.resizeTooltipEl = null;
  }

  private deleteGroup(groupId: string): void {
    this.captureSnapshot();
    const n = this.rows * this.cols;
    for (let i = 0; i < n; i++) {
      const cell = this.cellEls[i];
      if (cell.dataset['groupId'] !== groupId) continue;
      delete cell.dataset['zone'];
      delete cell.dataset['customColor'];
      delete cell.dataset['groupId'];
      cell.style.background = '';
      cell.style.boxShadow  = '';
    }
    this.notifyChange();
  }

  // ─── Undo / Redo ─────────────────────────────────────────────────────────────
  private snapshotCurrentState(): GardenGridValue {
    return {
      cols:   this.cols,
      rows:   this.rows,
      cells:  this.cells.map(c => ({ ...c })),
      groups: this.groups.map(g => ({ ...g })),
      notes:  this.planNotes,
    };
  }

  private captureSnapshot(): void {
    this.undoStack.push(this.snapshotCurrentState());
    if (this.undoStack.length > this.MAX_HISTORY) this.undoStack.shift();
    this.redoStack = [];
  }

  private applySnapshot(snapshot: GardenGridValue): void {
    this.cols      = snapshot.cols;
    this.rows      = snapshot.rows;
    this.cells     = snapshot.cells;
    this.groups    = snapshot.groups;
    this.planNotes = snapshot.notes;
    this.buildGrid();
    this.applyStoredCells();
    this.gardenGroup.setValue(snapshot, { emitEvent: false });
    this.gardenGroup.markAsTouched();
  }

  private undo(): void {
    if (!this.undoStack.length) return;
    this.redoStack.push(this.snapshotCurrentState());
    this.applySnapshot(this.undoStack.pop()!);
  }

  private redo(): void {
    if (!this.redoStack.length) return;
    this.undoStack.push(this.snapshotCurrentState());
    if (this.undoStack.length > this.MAX_HISTORY) this.undoStack.shift();
    this.applySnapshot(this.redoStack.pop()!);
  }

  private restoreMoveCell(r: number, c: number, cols: number): void {
    const cell = this.cellEls[r * cols + c];
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
