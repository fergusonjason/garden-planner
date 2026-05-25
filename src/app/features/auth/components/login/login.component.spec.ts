import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { LoginComponent } from './login.component';
import { AuthService } from '@core/services/auth.service';
import { provideRouter } from '@angular/router';

const mockAuthService = {
  signIn: vi.fn()
};

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call signIn on submit', () => {
    // TODO: implement
  });

  it('should display error message on failure', () => {
    // TODO: implement
  });

  it('should disable submit button while loading', () => {
    // TODO: implement
  });
});