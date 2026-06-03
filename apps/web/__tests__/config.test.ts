import { getApiConfig } from '../lib/config';

describe('Config Loader', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // clears the cache
    process.env = { ...OLD_ENV }; // make a copy
  });

  afterAll(() => {
    process.env = OLD_ENV; // restore old env
  });

  it('should return the correct API URL and SECRET API KEY from environment variables', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.test.com';
    process.env.SECRET_API_KEY = 'test_secret_key';

    const config = getApiConfig();

    expect(config.apiUrl).toBe('https://api.test.com');
    expect(config.apiKey).toBe('test_secret_key');
  });

  it('should throw an error if SECRET_API_KEY is missing', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.test.com';
    delete process.env.SECRET_API_KEY;

    expect(() => getApiConfig()).toThrow('API Key is missing! Check your .env file.');
  });
});
