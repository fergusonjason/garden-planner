import { PlantDef } from "../models/plant-def";

export type PlantMap = Record<string, Omit<PlantDef, 'key'>>;