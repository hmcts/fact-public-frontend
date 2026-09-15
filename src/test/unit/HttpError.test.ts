import { HTTPError } from '../../main/HttpError';

describe('HTTPError', () => {
  test('preserves the message and status code', () => {
    const error = new HTTPError('Bad request', 400);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('Error');
    expect(error.message).toBe('Bad request');
    expect(error.status).toBe(400);
  });
});
