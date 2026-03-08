import { Component, AfterViewInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─── Plant definition ─────────────────────────────────────────────────────────
interface PlantDef {
  key: string;
  rowWidth: number;
  gap: number;
  color: string;
  notes: string;
  aliases: string[];
}

const PLANT_MAP: Record<string, Omit<PlantDef, 'key'>> = {
  bean:        { rowWidth:1, gap:2, color:'#7a9a4a', notes:'Bush or pole types',     aliases:['beans','bean','green bean','green beans'] },
  beet:        { rowWidth:1, gap:1, color:'#8a2a5a', notes:'Thin to 3 in apart',     aliases:['beets','beet','beetroot'] },
  broccoli:    { rowWidth:2, gap:2, color:'#3a6a4a', notes:'Side shoots continue',   aliases:['broccoli'] },
  cabbage:     { rowWidth:2, gap:2, color:'#4a7a5a', notes:'Large heads',            aliases:['cabbage','cabbages'] },
  carrot:      { rowWidth:1, gap:1, color:'#d4782a', notes:'Deep loose soil',        aliases:['carrots','carrot'] },
  cauliflower: { rowWidth:2, gap:2, color:'#c8c8a0', notes:'Blanch heads',           aliases:['cauliflower'] },
  corn:        { rowWidth:1, gap:2, color:'#c9a84c', notes:'Plant in blocks',        aliases:['corn','maize','sweetcorn'] },
  cowpea:      { rowWidth:1, gap:2, color:'#8faa5a', notes:'Heat-tolerant legume',   aliases:['cowpeas','cowpea','black-eyed peas','black eyed peas','southern peas'] },
  cucumber:    { rowWidth:2, gap:3, color:'#4a8a2a', notes:'Trellis saves space',    aliases:['cucumbers','cucumber'] },
  eggplant:    { rowWidth:2, gap:3, color:'#6a3a8a', notes:'Needs heat',             aliases:['eggplant','aubergine'] },
  garlic:      { rowWidth:1, gap:1, color:'#c8b898', notes:'Fall planting',          aliases:['garlic'] },
  herb:        { rowWidth:1, gap:1, color:'#7aba8a', notes:'Mixed herb rows',        aliases:['herbs','herb','basil','parsley','cilantro','mint','thyme','oregano','rosemary','dill'] },
  kale:        { rowWidth:1, gap:2, color:'#3a7a3a', notes:'Cold-hardy',             aliases:['kale'] },
  lettuce:     { rowWidth:1, gap:1, color:'#5a9e4a', notes:'Partial shade ok',       aliases:['lettuce','salad'] },
  melon:       { rowWidth:3, gap:5, color:'#8aba4a', notes:'Needs warm season',      aliases:['melons','melon','watermelon','cantaloupe'] },
  onion:       { rowWidth:1, gap:1, color:'#b89a7a', notes:'From sets or seed',      aliases:['onions','onion'] },
  pea:         { rowWidth:1, gap:2, color:'#6a9a5a', notes:'Cool season, trellis',   aliases:['peas','pea'] },
  pepper:      { rowWidth:1, gap:2, color:'#c4632a', notes:'Full sun',               aliases:['peppers','pepper','capsicum'] },
  potato:      { rowWidth:1, gap:3, color:'#a89060', notes:'Hilled rows',            aliases:['potatoes','potato'] },
  pumpkin:     { rowWidth:4, gap:6, color:'#d06a20', notes:'Very large sprawl',      aliases:['pumpkins','pumpkin'] },
  radish:      { rowWidth:1, gap:1, color:'#c84a7a', notes:'30-day quick crop',      aliases:['radishes','radish'] },
  spinach:     { rowWidth:1, gap:1, color:'#4a8a4a', notes:'Cool season',            aliases:['spinach'] },
  strawberry:  { rowWidth:1, gap:2, color:'#c84a5a', notes:'Matted or hill system',  aliases:['strawberries','strawberry'] },
  sunflower:   { rowWidth:1, gap:2, color:'#e8c020', notes:'Tall — plant at N end',  aliases:['sunflowers','sunflower'] },
  tomato:      { rowWidth:2, gap:4, color:'#b84a3a', notes:'Stake or cage',          aliases:['tomatoes','tomato'] },
  zucchini:    { rowWidth:3, gap:4, color:'#3a7a2a', notes:'Sprawling habit',        aliases:['zucchini','courgette','squash'] },
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements AfterViewInit, OnDestroy {

  // ─── Grid dimensions ────────────────────────────────────────────────────────
  cols = 40;
  rows = 25;
  colsInput = 40;
  rowsInput = 25;
  dimWarning = false;

  // ─── Paint state ────────────────────────────────────────────────────────────
  activePlantKey    = 'tomato';
  activePlantColor: string | null = null;
  activePlantName: string | null  = null;
  currentZone: string | null      = null;
  selectedModalKey: string | null = null;
  isPainting = false;
  paintedCount = 0;
  nextCol = 0;
  nextRow = 0;

  // ─── Modal ──────────────────────────────────────────────────────────────────
  modalOpen = false;

  // ─── Plant data exposed to template ─────────────────────────────────────────
  readonly plantEntries: PlantDef[] = Object.entries(PLANT_MAP).map(([key, p]) => ({ key, ...p }));

  readonly toolbarPlants = [
    { key: 'tomato',   label: 'Tomatoes',    color: PLANT_MAP['tomato'].color },
    { key: 'cucumber', label: 'Cucumbers',   color: PLANT_MAP['cucumber'].color },
    { key: 'corn',     label: 'Corn',        color: PLANT_MAP['corn'].color },
    { key: 'bean',     label: 'Green Beans', color: PLANT_MAP['bean'].color },
    { key: 'carrot',   label: 'Carrots',     color: PLANT_MAP['carrot'].color },
    { key: 'pepper',   label: 'Peppers',     color: PLANT_MAP['pepper'].color },
  ];

  private mouseUpListener = () => { this.isPainting = false; };
  private keydownListener = (e: KeyboardEvent) => { if (e.key === 'Escape') this.closeModal(); };

  // ─── Lifecycle ───────────────────────────────────────────────────────────────
  ngAfterViewInit(): void {
    document.addEventListener('mouseup', this.mouseUpListener);
    document.addEventListener('keydown', this.keydownListener);

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
  }

  // ─── Dimensions ─────────────────────────────────────────────────────────────
  applyDimensions(): void {
    this.cols = Math.min(200, Math.max(5, this.colsInput || 40));
    this.rows = Math.min(200, Math.max(5, this.rowsInput || 25));
    this.colsInput = this.cols;
    this.rowsInput = this.rows;
    this.dimWarning = false;
    this.buildGrid();
  }

  // ─── Grid ───────────────────────────────────────────────────────────────────
  buildGrid(): void {
    const grid   = document.getElementById('garden-grid')!;
    const rulerX = document.getElementById('ruler-x')!;
    const rulerY = document.getElementById('ruler-y')!;

    grid.innerHTML = '';
    rulerX.innerHTML = '';
    rulerY.innerHTML = '';

    grid.style.gridTemplateColumns = `repeat(${this.cols}, var(--cell-size))`;
    grid.style.gridTemplateRows    = `repeat(${this.rows}, var(--cell-size))`;

    for (let c = 0; c < this.cols; c++) {
      const d = document.createElement('div');
      d.className = 'ruler-cell' + ((c + 1) % 5 === 0 ? ' labeled' : '');
      d.textContent = (c + 1) % 5 === 0 ? String(c + 1) : '';
      rulerX.appendChild(d);
    }

    for (let r = 0; r < this.rows; r++) {
      const d = document.createElement('div');
      d.className = 'ruler-cell' + ((r + 1) % 5 === 0 ? ' labeled' : '');
      d.textContent = (r + 1) % 5 === 0 ? String(r + 1) : '';
      rulerY.appendChild(d);
    }

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        if ((c + 1) % 5 === 0 && c + 1 < this.cols) cell.classList.add('mark-col');
        if ((r + 1) % 5 === 0 && r + 1 < this.rows) cell.classList.add('mark-row');
        cell.dataset['row'] = String(r);
        cell.dataset['col'] = String(c);
        cell.addEventListener('mouseenter', () => {
          if (this.isPainting) this.paintCell(cell);
        });
        cell.addEventListener('mousedown', (e) => {
          e.preventDefault();
          this.isPainting = true;
          this.paintCell(cell);
        });
        cell.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          this.eraseCell(cell);
        });
        grid.appendChild(cell);
      }
    }

    this.paintedCount = 0;
    this.nextCol = 0;
    this.nextRow = 0;
    this.setAreaDisplay();
    this.setFeedback('', '');
  }

  // ─── Paint ──────────────────────────────────────────────────────────────────
  selectToolbarPlant(key: string): void {
    this.activePlantKey  = key;
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

  selectPlantFromModal(key: string): void {
    const p = PLANT_MAP[key];
    this.selectedModalKey = key;
    this.activePlantKey   = key;
    this.currentZone      = null;
    this.activePlantColor = p.color;
    this.activePlantName  = p.aliases[0];
    this.closeModal();
  }

  clearPlantMode(): void {
    this.selectedModalKey = null;
    this.selectToolbarPlant('tomato');
  }

  paintCell(cell: HTMLElement): void {
    const hadColor = cell.dataset['zone'] || cell.dataset['customColor'];

    if (this.activePlantColor) {
      if (!hadColor) this.paintedCount++;
      cell.style.background       = this.activePlantColor;
      cell.dataset['zone']        = 'custom';
      cell.dataset['customColor'] = this.activePlantColor;
    } else if (this.currentZone === 'erase') {
      this.eraseCell(cell);
      return;
    } else if (this.currentZone) {
      if (!hadColor) this.paintedCount++;
      cell.dataset['zone'] = this.currentZone;
      delete cell.dataset['customColor'];
      cell.style.background = '';
    }
    this.setAreaDisplay();
  }

  eraseCell(cell: HTMLElement): void {
    if (cell.dataset['zone'] || cell.dataset['customColor']) {
      delete cell.dataset['zone'];
      delete cell.dataset['customColor'];
      cell.style.background = '';
      this.paintedCount = Math.max(0, this.paintedCount - 1);
      this.setAreaDisplay();
    }
  }

  // ─── Clear ──────────────────────────────────────────────────────────────────
  clearGrid(): void {
    if (!confirm('Clear the entire garden? This cannot be undone.')) return;
    document.querySelectorAll('.cell').forEach((c: Element) => {
      const el = c as HTMLElement;
      delete el.dataset['zone'];
      delete el.dataset['customColor'];
      el.style.background = '';
    });
    this.paintedCount = 0;
    this.nextCol = 0;
    this.nextRow = 0;
    this.setAreaDisplay();
    this.setFeedback('', '');
  }

  // ─── Modal ──────────────────────────────────────────────────────────────────
  openModal(): void  { this.modalOpen = true; }
  closeModal(): void { this.modalOpen = false; }
  closeModalBackdrop(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) this.closeModal();
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
    const limit  = isVert ? this.cols : this.rows;
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
      const crossLimit = isVert ? this.rows : this.cols;
      for (let cross = 0; cross < crossLimit; cross++) {
        for (let w = 0; w < plant.rowWidth; w++) {
          const along = lineStart + w;
          if (along >= limit) continue;
          const idx  = isVert ? (cross * this.cols + along) : (along * this.cols + cross);
          const cell = cells[idx] as HTMLElement;
          if (!cell) continue;
          if (!cell.dataset['customColor'] && !cell.dataset['zone']) this.paintedCount++;
          cell.style.background       = plant.color;
          cell.dataset['zone']        = 'custom';
          cell.dataset['customColor'] = plant.color;
        }
      }
    }

    const endPos = start + totalSpan;
    if (isVert) { if (endPos > this.nextCol) this.nextCol = endPos; }
    else         { if (endPos > this.nextRow) this.nextRow = endPos; }

    this.setAreaDisplay();
    const axis     = isVert ? 'X' : 'Y';
    const nextFree = isVert ? this.nextCol : this.nextRow;
    return {
      ok: true,
      msg: `✓ Planted ${resolvedCount} ${orientation} row${resolvedCount > 1 ? 's' : ''} of ${plant.aliases[0]} — ${plant.rowWidth}ft wide, ${sep}ft gap — ${axis}=${start + 1}–${endPos}ft. Next free: ${axis}=${nextFree + 1}ft.`
    };
  }

  runCommand(): void {
    const input = document.getElementById('cmd-input') as HTMLInputElement;
    const raw   = input.value.toLowerCase().trim();
    if (!raw) return;

    const isHoriz    = /\b(horizontal|horiz|across|east.?west|\bew\b)\b/.test(raw);
    const orientation = isHoriz ? 'horizontal' : 'vertical';
    const limit      = isHoriz ? this.rows : this.cols;

    let startAt: number | null = null;
    let endAt: number | null   = null;

    const rangeMatch = raw.match(/(?:from\s+|between\s+)(?:[xy]\s*[=:]?\s*)?(\d+)\s+(?:to|and)\s+(?:[xy]\s*[=:]?\s*)?(\d+)/);
    if (rangeMatch) {
      startAt = Math.max(0, parseInt(rangeMatch[1]) - 1);
      endAt   = Math.min(limit, parseInt(rangeMatch[2]));
      if (startAt >= endAt) {
        this.setFeedback('✗ End position must be greater than start position.', 'feedback-err');
        return;
      }
    } else {
      const startMatch = raw.match(/(?:starting\s+at|start(?:ing)?\s+(?:at\s+)?|from\s+|at\s+)(?:[xy]\s*[=:]?\s*)?(\d+)/);
      if (startMatch) {
        startAt = Math.max(0, parseInt(startMatch[1]) - 1);
        if (startAt >= limit) {
          this.setFeedback(`✗ Start position ${startAt + 1} is outside the garden (max ${limit}).`, 'feedback-err');
          return;
        }
      }
      const endMatch = raw.match(/(?:ending\s+at|end(?:ing)?\s+(?:at\s+)?|through\s+|up\s+to\s+|to\s+)(?:[xy]\s*[=:]?\s*)?(\d+)/);
      if (endMatch) endAt = Math.min(limit, parseInt(endMatch[1]));
    }

    let rawForCount = raw;
    if (rangeMatch) rawForCount = rawForCount.replace(rangeMatch[0], '');
    else {
      rawForCount = rawForCount.replace(/(?:starting\s+at|start(?:ing)?\s+(?:at\s+)?|from\s+|at\s+)(?:[xy]\s*[=:]?\s*)?\d+/, '');
      rawForCount = rawForCount.replace(/(?:ending\s+at|end(?:ing)?\s+(?:at\s+)?|through\s+|up\s+to\s+|to\s+)(?:[xy]\s*[=:]?\s*)?\d+/, '');
    }

    const wordNums: Record<string, number> = { a:1, an:1, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10 };
    let count = 1;
    const numMatch = rawForCount.match(/\b(\d+)\b/);
    if (numMatch) {
      count = parseInt(numMatch[1]);
    } else {
      for (const [w, n] of Object.entries(wordNums)) {
        if (new RegExp(`\\b${w}\\b`).test(rawForCount)) { count = n; break; }
      }
    }

    const plant = this.findPlant(raw);
    if (!plant) {
      this.setFeedback('✗ Plant not recognized. Click "Spacing Guide" to see all options.', 'feedback-err');
      return;
    }

    const result = this.createRows(count, plant, startAt, orientation, endAt);
    this.setFeedback(result.msg, result.ok ? 'feedback-ok' : 'feedback-err');
    input.value = '';
  }

  // ─── Export PNG ──────────────────────────────────────────────────────────────
  exportPNG(): void {
    const cellPx = 18, padLeft = 32, padTop = 30;
    const canvas  = document.createElement('canvas');
    canvas.width  = this.cols * cellPx + padLeft + 4;
    canvas.height = this.rows * cellPx + padTop  + 4;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1a1209';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e8c96d';
    ctx.font = 'bold 13px serif';
    ctx.fillText(`Garden Plan — ${this.cols} ft × ${this.rows} ft`, 10, 17);

    const zoneColors: Record<string, string> = { bed:'#6b3a2a', path:'#8b7355', lawn:'#3d6b45', water:'#2a5a7c', compost:'#4a3a1a', flowers:'#7a3a5a' };

    document.querySelectorAll('.cell').forEach((c: Element) => {
      const cell   = c as HTMLElement;
      const r      = +cell.dataset['row']!;
      const col    = +cell.dataset['col']!;
      const custom = cell.dataset['customColor'] || cell.style.background;
      const zone   = cell.dataset['zone'];
      ctx.fillStyle = (custom && custom !== '') ? custom : (zone ? (zoneColors[zone] || '#2a4a30') : '#2a4a30');
      ctx.fillRect(padLeft + col * cellPx, padTop + r * cellPx, cellPx, cellPx);
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth   = 0.4;
      ctx.strokeRect(padLeft + col * cellPx, padTop + r * cellPx, cellPx, cellPx);
    });

    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    for (let c = 5; c < this.cols; c += 5) { ctx.beginPath(); ctx.moveTo(padLeft + c * cellPx, padTop); ctx.lineTo(padLeft + c * cellPx, padTop + this.rows * cellPx); ctx.stroke(); }
    for (let r = 5; r < this.rows; r += 5) { ctx.beginPath(); ctx.moveTo(padLeft, padTop + r * cellPx); ctx.lineTo(padLeft + this.cols * cellPx, padTop + r * cellPx); ctx.stroke(); }

    ctx.strokeStyle = '#c9a84c'; ctx.lineWidth = 2;
    ctx.strokeRect(padLeft, padTop, this.cols * cellPx, this.rows * cellPx);
    ctx.fillStyle = '#c9a84c'; ctx.font = '7px monospace';
    for (let c = 4; c < this.cols; c += 5) ctx.fillText(String(c + 1), padLeft + c * cellPx - 4, padTop - 3);
    for (let r = 4; r < this.rows; r += 5) ctx.fillText(String(r + 1), 4, padTop + r * cellPx + cellPx / 2 + 3);

    canvas.toBlob(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob!);
      a.download = `garden-plan-${this.cols}x${this.rows}.png`;
      a.click();
    });
  }

  exportPDF(): void { window.print(); }

  // ─── .garden export / import ─────────────────────────────────────────────────
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

    for (let r = 0; r < this.rows; r++) {
      let rs = 0;
      while (rs < this.cols) {
        const plant = painted[`${rs},${r}`] || null;
        if (!plant) { rs++; continue; }
        let len = 1;
        while (rs + len < this.cols && (painted[`${rs + len},${r}`] || null) === plant) len++;
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
      if (!newCols || !newRows) throw new Error('Missing width/height in .garden file');

      this.cols      = newCols; this.colsInput = newCols;
      this.rows      = newRows; this.rowsInput = newRows;
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
          if (col >= this.cols || y >= this.rows) continue;
          const cell = cellEls[y * this.cols + col] as HTMLElement;
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

      this.paintedCount = count;
      this.setAreaDisplay();
      this.setFeedback(`✓ Loaded ${file.name} — ${this.cols}×${this.rows} ft, ${count} sq ft planted`, 'feedback-ok');
    } catch (err: any) {
      this.setFeedback(`✗ Failed to load: ${err.message}`, 'feedback-err');
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  private setAreaDisplay(): void {
    const el = document.getElementById('area-display');
    if (el) el.textContent = `Planted: ${this.paintedCount} sq ft`;
  }

  setFeedback(msg: string, cls: string): void {
    const fb = document.getElementById('cmd-feedback');
    if (!fb) return;
    fb.textContent = msg;
    fb.className   = cls;
  }
}