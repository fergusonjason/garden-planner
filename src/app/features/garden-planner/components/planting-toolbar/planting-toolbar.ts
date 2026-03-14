import { Component, computed, input, output } from '@angular/core';
import { PLANT_MAP } from 'src/app/shared/constants/plant-map-constants';
import { SelectedPlant } from 'src/app/shared/models/selected-plant';

@Component({
  selector: 'garden-planner-planting-toolbar',
  imports: [],
  templateUrl: './planting-toolbar.html',
  styleUrl: './planting-toolbar.css',
})
export class PlantingToolbar {

  selectedPlant = input.required<SelectedPlant>();

  selectPlant = output<SelectedPlant>();

  activePlantKey = computed<string>(() => this.selectedPlant().activePlantKey);

  currentZone = computed<string | null>(() => this.selectedPlant().currentZone);

  readonly toolbarPlants = [
    { key: 'tomato',   label: 'Tomatoes',    color: PLANT_MAP['tomato'].color },
    { key: 'cucumber', label: 'Cucumbers',   color: PLANT_MAP['cucumber'].color },
    { key: 'corn',     label: 'Corn',        color: PLANT_MAP['corn'].color },
    { key: 'bean',     label: 'Green Beans', color: PLANT_MAP['bean'].color },
    { key: 'carrot',   label: 'Carrots',     color: PLANT_MAP['carrot'].color },
    { key: 'pepper',   label: 'Peppers',     color: PLANT_MAP['pepper'].color },
  ];

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
}
