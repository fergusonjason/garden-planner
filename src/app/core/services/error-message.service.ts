import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorMessageService {

  readonly errorMessages = signal<string[]>([]);
  readonly warningMessages = signal<string[]>([]);

  addError(message: string): void {
    this.errorMessages.update(messages => [...messages, message]);
  }

  addWarning(message: string): void {
    this.warningMessages.update(messages => [...messages, message]);
  }

  clearErrors(): void {
    this.errorMessages.set([]);
  }

  clearWarnings(): void {
    this.warningMessages.set([]);
  }

  clearAll(): void {
    this.errorMessages.set([]);
    this.warningMessages.set([]);
  }
}