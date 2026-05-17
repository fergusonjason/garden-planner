import { Injectable } from '@angular/core';

import { GardenCellData, GardenGridValue, PlantGroup } from '../components/garden-grid/garden-grid';

interface GardenSpan { x: number; y: number; len: number; plant: string; groupId?: string; }
interface GardenJSON  { version: number; width: number; height: number; spans: GardenSpan[]; groups?: PlantGroup[]; notes?: string; }

@Injectable({
  providedIn: 'root',
})
export class GardenService {

  buildGardenJSON(value: GardenGridValue): string {
    const { cols, rows, cells, groups } = value;
    const paintedPlant:   Record<string, string> = {};
    const paintedGroupId: Record<string, string> = {};
    for (const { x, y, plant, groupId } of cells) {
      paintedPlant[`${x},${y}`]   = plant;
      if (groupId) paintedGroupId[`${x},${y}`] = groupId;
    }

    const spans: GardenSpan[] = [];
    for (let r = 0; r < rows; r++) {
      let rs = 0;
      while (rs < cols) {
        const plant = paintedPlant[`${rs},${r}`] ?? null;
        if (!plant) { rs++; continue; }
        const groupId = paintedGroupId[`${rs},${r}`];
        let len = 1;
        while (rs + len < cols && paintedPlant[`${rs + len},${r}`] === plant && paintedGroupId[`${rs + len},${r}`] === groupId) len++;
        spans.push({ x: rs, y: r, len, plant, ...(groupId ? { groupId } : {}) });
        rs += len;
      }
    }

    const json: GardenJSON = { version: 1, width: cols, height: rows, spans, ...(groups.length ? { groups } : {}) };
    return JSON.stringify(json);
  }

  parseGardenJSON(text: string): GardenGridValue {
    const json: GardenJSON = JSON.parse(text);
    const { width: cols, height: rows, spans, groups = [] } = json;
    if (!cols || !rows) throw new Error('Missing width/height in .garden file');

    const cells: GardenCellData[] = [];
    for (const { x, y, len, plant, groupId } of spans) {
      for (let i = 0; i < len; i++) {
        const cx = x + i;
        if (cx >= cols || y >= rows) continue;
        cells.push({ x: cx, y, plant, ...(groupId ? { groupId } : {}) });
      }
    }

    return { cols, rows, cells, groups, notes: json.notes ?? '' };
  }


}
