export function getEnvVariable(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export function getApiUrl(): string {
  const domain = process.env.DOMAIN_NAME || 'localhost';
  const isDev = process.env.NODE_ENV !== 'production';
  const protocol = isDev ? 'http' : 'https';
  return `${protocol}://${domain}`; 
}
