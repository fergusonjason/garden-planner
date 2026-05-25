import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { isOnboardedGuard } from './is-onboarded-guard';

describe('isOnboardedGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => isOnboardedGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
