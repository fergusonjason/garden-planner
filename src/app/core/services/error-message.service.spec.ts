import { TestBed } from '@angular/core/testing';
import { ErrorMessageService } from '@core/services/error-message.service';

describe('ErrorMessageService', () => {
  let service: ErrorMessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ErrorMessageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialise with no error messages', () => {
    expect(service.errorMessages()).toEqual([]);
  });

  it('should initialise with no warning messages', () => {
    expect(service.warningMessages()).toEqual([]);
  });

  it('should add an error message', () => {
    service.addError('something went wrong');
    expect(service.errorMessages()).toContain('something went wrong');
  });

  it('should add a warning message', () => {
    service.addWarning('something looks off');
    expect(service.warningMessages()).toContain('something looks off');
  });

  it('should accumulate multiple error messages', () => {
    service.addError('first error');
    service.addError('second error');
    expect(service.errorMessages()).toHaveLength(2);
  });

  it('should accumulate multiple warning messages', () => {
    service.addWarning('first warning');
    service.addWarning('second warning');
    expect(service.warningMessages()).toHaveLength(2);
  });

  it('should clear error messages', () => {
    service.addError('something went wrong');
    service.clearErrors();
    expect(service.errorMessages()).toEqual([]);
  });

  it('should clear warning messages', () => {
    service.addWarning('something looks off');
    service.clearWarnings();
    expect(service.warningMessages()).toEqual([]);
  });

  it('should clear all messages', () => {
    service.addError('something went wrong');
    service.addWarning('something looks off');
    service.clearAll();
    expect(service.errorMessages()).toEqual([]);
    expect(service.warningMessages()).toEqual([]);
  });

  it('should not affect warnings when clearing errors', () => {
    service.addError('an error');
    service.addWarning('a warning');
    service.clearErrors();
    expect(service.warningMessages()).toHaveLength(1);
  });

  it('should not affect errors when clearing warnings', () => {
    service.addError('an error');
    service.addWarning('a warning');
    service.clearWarnings();
    expect(service.errorMessages()).toHaveLength(1);
  });
});