import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { RegisterComponent } from './register.component';
import { AuthService } from '@core/services/auth.service';
import { provideRouter } from '@angular/router';

const mockAuthService = {
  signUp: vi.fn()
};

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call signUp on submit', () => {
    // TODO: implement
  });

  it('should show confirmation message when status is PENDING', () => {
    // TODO: implement
  });

  it('should display error message on failure', () => {
    // TODO: implement
  });

  it('should disable submit button while loading', () => {
    // TODO: implement
  });
});