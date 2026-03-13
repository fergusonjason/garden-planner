import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ExportService {

  // ─── Export PNG ──────────────────────────────────────────────────────────────
  exportPNG(cols: number, rows: number): void {
    const cellPx = 18, padLeft = 32, padTop = 30;
    const canvas  = document.createElement('canvas');
    canvas.width  = cols * cellPx + padLeft + 4;
    canvas.height = rows * cellPx + padTop  + 4;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1a1209';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e8c96d';
    ctx.font = 'bold 13px serif';
    ctx.fillText(`Garden Plan — ${cols} ft × ${rows} ft`, 10, 17);

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
    for (let c = 5; c < cols; c += 5) { ctx.beginPath(); ctx.moveTo(padLeft + c * cellPx, padTop); ctx.lineTo(padLeft + c * cellPx, padTop + rows * cellPx); ctx.stroke(); }
    for (let r = 5; r < rows; r += 5) { ctx.beginPath(); ctx.moveTo(padLeft, padTop + r * cellPx); ctx.lineTo(padLeft + cols * cellPx, padTop + r * cellPx); ctx.stroke(); }

    ctx.strokeStyle = '#c9a84c'; ctx.lineWidth = 2;
    ctx.strokeRect(padLeft, padTop, cols * cellPx, rows * cellPx);
    ctx.fillStyle = '#c9a84c'; ctx.font = '7px monospace';
    for (let c = 4; c < cols; c += 5) ctx.fillText(String(c + 1), padLeft + c * cellPx - 4, padTop - 3);
    for (let r = 4; r < rows; r += 5) ctx.fillText(String(r + 1), 4, padTop + r * cellPx + cellPx / 2 + 3);

    canvas.toBlob(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob!);
      a.download = `garden-plan-${cols}x${rows}.png`;
      a.click();
    });
  }

  exportPDF(): void { window.print(); }
}
