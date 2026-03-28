import { Component, input, output } from '@angular/core';
import { PLANT_MAP } from 'src/app/shared/constants/plant-map-constants';
import { PlantDef } from 'src/app/shared/models/plant-def';
import { SelectedPlant } from 'src/app/shared/models/selected-plant';

@Component({
  selector: 'garden-planner-planting-selector',
  imports: [],
  templateUrl: './planting-selector.html',
  styleUrl: './planting-selector.css',
})
export class PlantingSelector {

  plantKey = input<string | null>();

  currentZone = input<string>("7B");

  selectPlant = output<SelectedPlant>();

  close = output<void>();

  readonly plantEntries: PlantDef[] = Object.entries(PLANT_MAP).map(([key, p]) => ({ key, ...p }));

  doSelectPlant(key: string): void {
    this.selectPlant.emit({
      plant: { key, ...PLANT_MAP[key] },
      currentZone: this.currentZone(),
    });
  }

  doClose(): void {
    this.close.emit();
  }
}
