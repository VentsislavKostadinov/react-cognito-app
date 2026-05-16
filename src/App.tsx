import "./App.css";
import { useEffect, useState } from "react";
import {
  redirectToLogin,
  getUserInfo,
  logout,
  checkAuthStatus,
} from "./services/authService";

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

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const checkAuth = async () => {
      console.log('=== Starting authentication check ===');
      console.log('Current URL:', window.location.href);
      console.log('Visible cookies:', document.cookie);
      
      // Check if we just came back from login (has returnUrl in URL)
      const urlParams = new URLSearchParams(window.location.search);
      const hasReturnUrl = urlParams.has('returnUrl');
      
      if (hasReturnUrl) {
        console.log('Detected return from login page, waiting for cookies to settle...');
        // Give cookies a moment to be set after redirect
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      try {
        // Try multiple times with delay (cookies might take a moment after redirect)
        let authenticated = false;
        let attempts = 0;
        const maxAttempts = 3;
        
        while (!authenticated && attempts < maxAttempts) {
          attempts++;
          console.log(`Auth attempt ${attempts}/${maxAttempts}`);
          
          authenticated = await checkAuthStatus();
          
          if (!authenticated && attempts < maxAttempts) {
            console.log('Not authenticated yet, waiting 1 second before retry...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        console.log('Final authentication status:', authenticated);
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          console.log('User is authenticated, fetching user info...');
          const info = await getUserInfo();
          setUserInfo(info);
          console.log('User info loaded successfully');
          return;
        } else {
          console.log('User is NOT authenticated, redirecting to login...');
          redirectToLogin();
        }
      } catch (err) {
        console.error("Auth check failed with error:", err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setIsAuthenticated(false);
        
        // Show error for 2 seconds then redirect
        setTimeout(() => {
          redirectToLogin();
        }, 2000);
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, []);

  const handleSignOut = async () => {
    try {
      await logout();
      setIsAuthenticated(false);
      setUserInfo(null);
      redirectToLogin(false); // Don't include returnUrl on logout
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  if (checking) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ fontSize: '18px', marginBottom: '20px' }}>🔍 Checking authentication...</div>
        <div style={{ padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
          <p>Please wait while we verify your session...</p>
          <p style={{ fontSize: '12px', color: '#666' }}>Check browser console (F12) for detailed logs</p>
        </div>
        {error && (
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#fee', 
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c00'
          }}>
            <strong>⚠️ Error:</strong> {error}
          </div>
        )}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ fontSize: '18px', marginBottom: '20px' }}>
          Redirecting to login...
        </div>
        {error && (
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#fee', 
            border: '1px solid #fcc',
            borderRadius: '4px',
            color: '#c00'
          }}>
            <strong>⚠️ Error:</strong> {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#d4edda', 
        border: '2px solid #28a745',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#155724' }}>
          ✅ Authentication Successful!
        </h2>
        <p style={{ margin: 0, color: '#155724' }}>
          You are successfully logged in with HttpOnly cookies
        </p>
      </div>

      {userInfo && (
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>User Information</h3>
          <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
            <p><strong>Status:</strong> {userInfo.valid ? '✅ Valid' : '❌ Invalid'}</p>
            <p><strong>Name:</strong> {userInfo.claims.name}</p>
            <p><strong>Email:</strong> {userInfo.email}</p>
            <p><strong>Email Verified:</strong> {userInfo.claims.email_verified ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Username:</strong> {userInfo.username}</p>
            <p><strong>User ID (sub):</strong> {userInfo.sub}</p>
            <p><strong>Token Use:</strong> {userInfo.tokenUse}</p>
          </div>
        </div>
      )}
      
      <div style={{ 
        marginBottom: '20px',
        padding: '15px', 
        backgroundColor: '#e7f3ff', 
        borderRadius: '8px',
        border: '1px solid #b3d9ff'
      }}>
        <strong>🔒 Security Note:</strong> Your session is secured with HttpOnly cookies. 
        Tokens are stored securely and cannot be accessed by JavaScript, protecting against XSS attacks.
      </div>
      
      <button 
        onClick={handleSignOut}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
      >
        Sign Out
      </button>
    </div>
  );
}

export default App;