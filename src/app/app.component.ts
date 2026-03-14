import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { GardenPlannerMain } from './features/garden-planner/components/garden-planner-main/garden-planner-main';



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