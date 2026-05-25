import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ErrorMessageService } from '@core/services/error-message.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'gp-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  private readonly authService = inject(AuthService);
  private readonly errorService = inject(ErrorMessageService);

  private readonly router = inject(Router)
  private readonly fb = inject(FormBuilder);

  isLoading = signal<boolean>(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  errorMessages = this.errorService.errorMessages;

  async onSubmit(): Promise<void> {

    this.errorService.clearErrors();
    if (this.form.valid) {
      this.isLoading.set(true);

      const { email, password} = this.form.getRawValue();

      try {
        await this.authService.signIn(email!, password!);
        await this.router.navigate(['/']);
      } catch (error) {
        this.errorService.addError('Failed to sign in: ' + (error instanceof Error ? error.message : String(error)));
      } finally {
        this.isLoading.set(false);
      }

    }
  }

}
