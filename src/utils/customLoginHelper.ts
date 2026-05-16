import { CognitoUserSession } from 'amazon-cognito-identity-js';

export const sendTokensToMainApp = (session: CognitoUserSession, email: string) => {
  const params = new URLSearchParams(window.location.search);
  const returnUrl = params.get('returnUrl') || import.meta.env.VITE_APP_URL;
  
  if (!returnUrl) {
    console.error('No returnUrl provided and VITE_APP_URL not configured');
    throw new Error('Return URL is required for secure authentication');
  }

  const idToken = session.getIdToken().getJwtToken();
  const accessToken = session.getAccessToken().getJwtToken();
  const refreshToken = session.getRefreshToken().getToken();

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
      returnUrl 
    );

    window.close();
  }
};