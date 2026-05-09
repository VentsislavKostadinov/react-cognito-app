import "./App.css";
import { useEffect, useState } from "react";
import {
  getTokens,
  clearTokens,
  redirectToLogin,
} from "./services/authService";

function App() {
  const [user, setUser] = useState<{
    email: string;
    idToken: string;
    accessToken: string;
    refreshToken: string;
  } | null>(() => getTokens());

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      redirectToLogin();
    }
  }, [user]);

  const handleSignOut = () => {
    clearTokens();
    setUser(null);
    redirectToLogin();
  };

  if (!user) {
    return <div>Opening login window...</div>;
  }

  return (
    <div>
      <pre> Hello: {user.email} </pre>
      <pre> ID Token: {user.idToken} </pre>
      <pre> Access Token: {user.accessToken} </pre>
      <pre> Refresh Token: {user.refreshToken} </pre>
      <button onClick={handleSignOut}>Sign out</button>
    </div>
  );
}

export default App;
