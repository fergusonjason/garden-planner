import { PlantDef } from './plant-def';

export interface SelectedPlant {
  plant: PlantDef;
  currentZone: string | null;
}
