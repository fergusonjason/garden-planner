import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { authGuard } from '@core/guards/auth.guard';
import { AuthService } from '@core/services/auth.service';
import { signal } from '@angular/core';

const mockRouter = { navigate: vi.fn() };

describe('authGuard', () => {
  let authService: AuthService;

  const runGuard = () =>
    TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter }
      ]
    });
    authService = TestBed.inject(AuthService);
  });

  it('should allow navigation when user is logged in', () => {
    // TODO: implement
  });

  it('should redirect to /login when user is not logged in', () => {
    // TODO: implement
  });
});