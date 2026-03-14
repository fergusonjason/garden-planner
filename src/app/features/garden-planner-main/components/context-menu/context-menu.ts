import { Component, input, output } from '@angular/core';
import { PLANT_MAP } from 'src/app/shared/constants/plant-map-constants';

@Component({
  selector: 'garden-planner-context-menu',
  imports: [],
  templateUrl: './context-menu.html',
  styleUrl: './context-menu.css',
})
export class ContextMenu {

  menuOpen = input.required<boolean>();

  menuX = input.required<number>();
  menuY = input.required<number>();

  exportPNG = output<void>();

  exportPDF = output<void>();

  selectQuickPickPlant = output<string>();

  readonly quickPickPlants = [
    { key: 'corn',     color: PLANT_MAP['corn'].color },
    { key: 'cucumber', color: PLANT_MAP['cucumber'].color },
    { key: 'bean',     color: PLANT_MAP['bean'].color },
    { key: 'tomato',   color: PLANT_MAP['tomato'].color },
  ];

  doExportPNG(): void { this.exportPNG.emit(); }

  doExportPDF(): void { this.exportPDF.emit(); }

  doSelectQuickPickPlant(plantKey: string): void {
    this.selectQuickPickPlant.emit(plantKey);
  }

}
