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

    const p = PLANT_MAP[key];

    const selectedPlant: SelectedPlant = {
      selectedModalKey: key,
      activePlantKey: key,
      activePlantColor: p.color,
      activePlantName: p.aliases[0],
      currentZone: this.currentZone(),
    };

    this.selectPlant.emit(selectedPlant);

  }

  doClose(): void {
    this.close.emit();
  }
}
