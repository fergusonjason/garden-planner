import { Component, inject } from '@angular/core';
import { UserService } from '@core/services/user.service';
import { UserProfileBuilder } from '@shared/models/user-profile.builder';
import { UserPreferencesBuilder } from '@shared/models/user-preferences.builder';

@Component({
  selector: 'quick-tips',
  standalone: true,
  templateUrl: './quick-tips.component.html',
})
export class QuickTipsComponent {
  private readonly userService = inject(UserService);

  async onCheck(e: Event): Promise<void> {
    const suppress = (e.target as HTMLInputElement).checked;
    const profile = this.userService.profile;
    if (!profile?.preferences) return;

    const updatedPrefs = UserPreferencesBuilder.from(profile.preferences).showQuickTips(!suppress).build();
    const updatedProfile = UserProfileBuilder.from(profile).preferences(updatedPrefs).build();
    await this.userService.upsertProfile(updatedProfile);
  }
}
