import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ViewChild, ViewContainerRef } from '@angular/core';
import { GardenPlannerMain } from './features/garden-planner/components/garden-planner-main/garden-planner-main';
import { DialogService } from './shared/services/dialog-service';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule,
    GardenPlannerMain
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements AfterViewInit {

  @ViewChild('dialogContainer', { read: ViewContainerRef })
  dialogContainer!: ViewContainerRef;

  constructor(private dialogService: DialogService) {}

  ngAfterViewInit(): void {

    // Register the dialog container with the DialogService so that any component can open dialogs.
    this.dialogService.setContainer(this.dialogContainer);
  }
}