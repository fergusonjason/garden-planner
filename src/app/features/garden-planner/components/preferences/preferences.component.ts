import { Component, inject } from '@angular/core';
import { DialogService } from 'src/app/shared/services/dialog-service';
import { ProfileSettingsFormComponent } from '@shared/components/profile-settings-form/profile-settings-form.component';

@Component({
  selector: 'gp-preferences',
  standalone: true,
  imports: [ProfileSettingsFormComponent],
  templateUrl: './preferences.component.html',
  styleUrl: './preferences.component.css',
})
export class PreferencesComponent {

  private readonly dialogService = inject(DialogService);

  onSaved(): void {
    this.dialogService.closeDialog();
  }

  cancel(): void {
    this.dialogService.closeDialog();
  }
}