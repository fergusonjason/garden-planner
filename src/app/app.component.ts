import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, OnDestroy, signal, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PLANT_MAP } from './shared/constants/plant-map-constants';
import { PlantDef } from './shared/models/plant-def';
import { ExportService } from './core/services/export-service';
import { GardenPlannerMain } from './features/garden-planner-main/components/garden-planner-main/garden-planner-main';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule,
    GardenPlannerMain
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent  {


}