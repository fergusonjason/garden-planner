import { inject } from '@angular/core';
import { UiService } from '@core/services/ui.service';

export async function uiDataInitializer(): Promise<void> {
  const uiService = inject(UiService);
  await uiService.initialize();
}
