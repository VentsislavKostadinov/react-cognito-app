export const getRedirectUri = (): string => {
  return window.location.hostname.includes('local')
    ? 'http://localhost:5173/'
    : import.meta.env.VITE_REDIRECT_URI;
};
