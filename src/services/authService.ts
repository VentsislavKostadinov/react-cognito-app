const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
const API_BASE_URL = `${BACKEND_URL}/api/auth`;

interface UserInfo {
  valid: boolean;
  message: string;
  claims: {
    sub: string;
    email_verified: boolean;
    name: string;
    email: string;
    'cognito:username': string;
    aud: string[];
    iss: string;
  };
  email: string;
  username: string;
  sub: string;
  tokenUse: string;
}

export const redirectToLogin = (includeReturnUrl = true) => {
  const CUSTOM_LOGIN_URL = import.meta.env.VITE_CUSTOM_LOGIN_URL;
  
  if (!CUSTOM_LOGIN_URL) {
    console.error('VITE_CUSTOM_LOGIN_URL environment variable is not set');
    return;
  }
  
  // Include returnUrl only when needed (e.g., auth failures, not logout)
  if (includeReturnUrl) {
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `${CUSTOM_LOGIN_URL}?returnUrl=${returnUrl}`;
  } else {
    // Clean redirect to login page (used for logout)
    window.location.href = CUSTOM_LOGIN_URL;
  }
};

export const getUserInfo = async (): Promise<UserInfo> => {
  console.log('Fetching user info from:', `${API_BASE_URL}/me`);
  console.log('Sending HttpOnly cookies automatically with credentials: include');
  
  try {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      credentials: 'include', // IMPORTANT: Sends HttpOnly cookies automatically
    });

    console.log('User info response status:', response.status);
    console.log('Response headers:', {
      'set-cookie': response.headers.get('set-cookie'),
      'content-type': response.headers.get('content-type'),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch user info:', response.status, errorText);
      
      // Provide specific error messages
      if (response.status === 401) {
        throw new Error('❌ Unauthorized - No valid authentication cookies found. Did you login successfully and get redirected back with cookies?');
      } else if (response.status === 403) {
        throw new Error('❌ Forbidden - Authentication token is invalid or expired.');
      } else if (response.status === 500) {
        throw new Error(`❌ Backend Server Error (500) - Check your backend logs for details. Error: ${errorText}`);
      }
      
      throw new Error(`Failed to fetch user info: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ User info retrieved successfully:', data);
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.error('❌ BACKEND NOT REACHABLE - Is your backend server running at', API_BASE_URL, '?');
      throw new Error(`Backend server not reachable at ${API_BASE_URL}. Please start your backend server.`, { cause: error });
    }
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    // Call backend logout endpoint to clear cookies
    await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include', // Send cookies so backend knows which session to clear
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export const checkAuthStatus = async (): Promise<boolean> => {
  try {
    console.log('Checking auth status...');
    console.log('Available cookies:', document.cookie);
    
    // Try to fetch user info - if successful, user is authenticated
    await getUserInfo();
    console.log('Auth check: User is authenticated');
    return true;
  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  }
};
