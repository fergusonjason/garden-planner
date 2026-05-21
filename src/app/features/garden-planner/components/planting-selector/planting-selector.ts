import { Component, computed, input, output, signal } from '@angular/core';
import { FLOWER_MAP, HERB_MAP, PLANT_MAP, VEGETABLE_MAP } from 'src/app/shared/constants/plant-map-constants';
import { PlantDef } from 'src/app/shared/models/plant-def';
import { SelectedPlant } from 'src/app/shared/models/selected-plant';

type PlantTab = 'vegetables' | 'herbs' | 'flowers';

@Component({
  selector: 'garden-planner-planting-selector',
  imports: [],
  templateUrl: './planting-selector.html',
  styleUrl: './planting-selector.css',
})
export class PlantingSelector {

  plantKey    = input<string | null>();
  currentZone = input<string>('7B');

  selectPlant = output<SelectedPlant>();
  close       = output<void>();

  activeTab = signal<PlantTab>('vegetables');

  readonly vegetableEntries: PlantDef[] = Object.entries(VEGETABLE_MAP).map(([key, p]) => ({ key, ...p }));
  readonly herbEntries:      PlantDef[] = Object.entries(HERB_MAP).map(([key, p]) => ({ key, ...p }));
  readonly flowerEntries:    PlantDef[] = Object.entries(FLOWER_MAP).map(([key, p]) => ({ key, ...p }));

  readonly activeEntries = computed<PlantDef[]>(() => {
    switch (this.activeTab()) {
      case 'herbs':   return this.herbEntries;
      case 'flowers': return this.flowerEntries;
      default:        return this.vegetableEntries;
    }
  });

  setTab(tab: PlantTab): void {
    this.activeTab.set(tab);
  }

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
