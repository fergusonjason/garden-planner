import { Injectable } from '@angular/core';

import { GardenCellData, GardenGridValue } from '../components/garden-grid/garden-grid';

interface GardenSpan { x: number; y: number; len: number; plant: string; }
interface GardenJSON  { version: number; width: number; height: number; spans: GardenSpan[]; }

@Injectable({
  providedIn: 'root',
})
export class GardenService {

  buildGardenJSON(value: GardenGridValue): string {
    const { cols, rows, cells } = value;
    const painted: Record<string, string> = {};
    for (const { x, y, plant } of cells) {
      painted[`${x},${y}`] = plant;
    }

    const spans: GardenSpan[] = [];
    for (let r = 0; r < rows; r++) {
      let rs = 0;
      while (rs < cols) {
        const plant = painted[`${rs},${r}`] ?? null;
        if (!plant) { rs++; continue; }
        let len = 1;
        while (rs + len < cols && painted[`${rs + len},${r}`] === plant) len++;
        spans.push({ x: rs, y: r, len, plant });
        rs += len;
      }
    }

    const json: GardenJSON = { version: 1, width: cols, height: rows, spans };
    return JSON.stringify(json);
  }

  parseGardenJSON(text: string): GardenGridValue {
    const json: GardenJSON = JSON.parse(text);
    const { width: cols, height: rows, spans } = json;
    if (!cols || !rows) throw new Error('Missing width/height in .garden file');

    const cells: GardenCellData[] = [];
    for (const { x, y, len, plant } of spans) {
      for (let i = 0; i < len; i++) {
        const cx = x + i;
        if (cx >= cols || y >= rows) continue;
        cells.push({ x: cx, y, plant });
      }
    }

    return { cols, rows, cells };
  }


}
