interface TokenData {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  email: string;
}

export const redirectToLogin = () => {
  const CUSTOM_LOGIN_URL = import.meta.env.VITE_CUSTOM_LOGIN_URL;
  const returnUrl = encodeURIComponent(window.location.origin);
  
  // Try to open custom login in a new window
  const loginWindow = window.open(
    `${CUSTOM_LOGIN_URL}?returnUrl=${returnUrl}`,
    'login',
    'width=500,height=600,scrollbars=yes'
  );

  // If popup was blocked, redirect the main window
  if (!loginWindow || loginWindow.closed || typeof loginWindow.closed === 'undefined') {
    // Popup blocked - redirect main window instead
    window.location.href = `${CUSTOM_LOGIN_URL}?returnUrl=${returnUrl}`;
    return;
  }

  // Listen for tokens from login window
  window.addEventListener('message', (event) => {
    // Verify origin for security
    if (event.origin !== CUSTOM_LOGIN_URL.replace(/\/$/, '')) {
      return;
    }

    if (event.data.type === 'LOGIN_SUCCESS' && event.data.tokens) {
      saveTokens(event.data.tokens);
      loginWindow?.close();
      window.location.reload(); // Reload to show authenticated state
    }
  });
};

export const saveTokens = (tokens: TokenData) => {
  localStorage.setItem('idToken', tokens.idToken);
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
  localStorage.setItem('userEmail', tokens.email);
};

export const getTokens = (): TokenData | null => {
  const idToken = localStorage.getItem('idToken');
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const email = localStorage.getItem('userEmail');

  if (!idToken || !accessToken || !refreshToken || !email) {
    return null;
  }

  return { idToken, accessToken, refreshToken, email };
};

export const clearTokens = () => {
  localStorage.removeItem('idToken');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userEmail');
  sessionStorage.clear();
  
  // Clear cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
};

export const isAuthenticated = (): boolean => {
  return getTokens() !== null;
};
