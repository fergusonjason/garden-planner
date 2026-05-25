import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { ErrorMessageService } from '@core/services/error-message.service';
import { SignupStatus } from '@shared/types/signup-status.type';

@Component({
  selector: 'gp-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  private readonly authService = inject(AuthService);
  private readonly errorMessageService = inject(ErrorMessageService);

  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  isLoading = signal<boolean>(false);
  confirmationPending = signal<boolean>(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  errorMessages = this.errorMessageService.errorMessages;
  warningMessages = this.errorMessageService.warningMessages;

  cancel(): void {
    this.router.navigate(['/login']);
  }

  async onSubmit(): Promise<void> {

    this.errorMessageService.clearErrors();

    if (this.form.valid) {
      const { email, password} = this.form.getRawValue();
      this.isLoading.set(true);
      try {
        // we're expecting PENDING. Pop an error or warning if we get
        // EXISTS or CONFIRMED.
        const signupStatus: SignupStatus = await this.authService.signUp(email!, password!);
        if (signupStatus === "EXISTS") {
          this.errorMessageService.addError("User account already exists. Please check your email for confirmation instructions.");
          return;
        }

        if (signupStatus === "PENDING") {
          this.confirmationPending.set(true);
          return;
        }

        if (signupStatus === "CONFIRMED") {
          this.errorMessageService.addWarning("Account already exists. Please sign in.");
          await this.router.navigate(['/']);
          return;
        }

      } catch (error) {
        this.errorMessageService.addError('Failed to sign up: ' + (error instanceof Error ? error.message : String(error)));
        return;
      } finally {
        this.isLoading.set(false);
      }
    }
  }
}