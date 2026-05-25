import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ProfileSettingsFormComponent } from '@shared/components/profile-settings-form/profile-settings-form.component';

@Component({
  selector: 'gp-onboarding',
  standalone: true,
  imports: [ProfileSettingsFormComponent],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css'
})
export class OnboardingComponent {

  private readonly router = inject(Router);

  onSaved(): void {
    this.router.navigate(['/']);
  }
}