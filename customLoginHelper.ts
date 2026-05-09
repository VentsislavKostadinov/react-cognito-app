// Add this to your custom login page after successful authentication
// This uses postMessage API for secure cross-origin communication

import { CognitoUserSession } from 'amazon-cognito-identity-js';

export const sendTokensToMainApp = (session: CognitoUserSession, email: string) => {
  // Get the return URL from query params (sent by main app)
  const params = new URLSearchParams(window.location.search);
  const returnUrl = params.get('returnUrl') || 'https://main.d16f2529r3lhi6.amplifyapp.com';

  // Extract tokens from session
  const idToken = session.getIdToken().getJwtToken();
  const accessToken = session.getAccessToken().getJwtToken();
  const refreshToken = session.getRefreshToken().getToken();

  // Send tokens securely via postMessage to opener window
  if (window.opener) {
    window.opener.postMessage(
      {
        type: 'LOGIN_SUCCESS',
        tokens: {
          idToken,
          accessToken,
          refreshToken,
          email,
        },
      },
      returnUrl // Target origin for security
    );
    
    // Close the login popup after sending tokens
    window.close();
  }
};

// Example usage in your Login component after successful signIn:
/*
import { signIn } from './services/cognitoService';
import { sendTokensToMainApp } from './utils/redirectHelper';

const handleLogin = async (email: string, password: string) => {
  try {
    const session = await signIn(email, password);
    sendTokensToMainApp(session, email);
  } catch (error) {
    console.error('Login failed:', error);
    setError(error.message);
  }
};
*/
