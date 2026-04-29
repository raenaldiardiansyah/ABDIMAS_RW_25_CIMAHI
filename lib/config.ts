export function getApiConfig() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const apiKey = process.env.SECRET_API_KEY || '';

  if (!apiKey) {
    throw new Error('API Key is missing! Check your .env file.');
  }

  return {
    apiUrl,
    apiKey,
  };
}
