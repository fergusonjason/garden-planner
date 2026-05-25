import { ApplicationError } from './application-error';

describe('ApplicationError', () => {

  it('should be an instance of Error', () => {
    const error = new ApplicationError('something went wrong');
    expect(error).toBeInstanceOf(Error);
  });

  it('should be an instance of ApplicationError', () => {
    const error = new ApplicationError('something went wrong');
    expect(error).toBeInstanceOf(ApplicationError);
  });

  it('should set the message', () => {
    const error = new ApplicationError('something went wrong');
    expect(error.message).toBe('something went wrong');
  });

  it('should have name ApplicationError', () => {
    const error = new ApplicationError('something went wrong');
    expect(error.name).toBe('ApplicationError');
  });

  it('should store a cause when provided', () => {
    const cause = new Error('third-party error');
    const error = new ApplicationError('something went wrong', cause);
    expect(error.cause).toBe(cause);
  });

  it('should have no cause when not provided', () => {
    const error = new ApplicationError('something went wrong');
    expect(error.cause).toBeUndefined();
  });
});