# Deployment Guide

## Overview
This guide covers how to deploy both the main React app and the custom login page for localhost and production environments.

## Architecture
- **Main App** (this repo): Displays protected content, uses HttpOnly cookies for auth
- **Login Page** (separate repo): Handles Cognito authentication, redirects back to main app
- **Backend API**: Spring Boot server that sets HttpOnly cookies and validates tokens

## Environment Configuration

### 📁 File Structure
```
.env               # Base config (Cognito settings) - COMMITTED to git
.env.local         # Localhost overrides - GITIGNORED
.env.production    # Production overrides - Create on deployment platform
.env.example       # Template for reference - COMMITTED to git
```

### 🔧 Main App Configuration

#### Localhost Development (`.env.local`)
```bash
VITE_BACKEND_URL=http://localhost:8080
VITE_CUSTOM_LOGIN_URL=http://localhost:5173
VITE_APP_URL=http://localhost:5174
```

#### Production (`.env.production` or platform env vars)
```bash
VITE_BACKEND_URL=http://cognito-app-backend-deploy.eba-3sq3fekp.eu-central-1.elasticbeanstalk.com
VITE_CUSTOM_LOGIN_URL=https://main.d2l13mf6ec69fe.amplifyapp.com
VITE_APP_URL=https://main.d16f2529r3lhi6.amplifyapp.com
```

### 🔐 Login Page Configuration
See [LOGIN_PAGE_CONFIG.md](LOGIN_PAGE_CONFIG.md) for detailed login page setup.

#### Localhost (Login Page `.env.local`)
```bash
VITE_USER_POOL_ID=eu-central-1_rS9qXL9Ee
VITE_CLIENT_ID=3t8p938oufoc1pstif4660vhmq
VITE_REGION=eu-central-1
VITE_APP_URL=http://localhost:5174
```

#### Production (Login Page `.env.production`)
```bash
VITE_USER_POOL_ID=eu-central-1_rS9qXL9Ee
VITE_CLIENT_ID=3t8p938oufoc1pstif4660vhmq
VITE_REGION=eu-central-1
VITE_APP_URL=https://main.d16f2529r3lhi6.amplifyapp.com
```

## Deployment Steps

### 1. Local Development Setup

#### Main App (localhost:5174)
```bash
# Clone and install
git clone <your-repo>
cd react-cognito-app
npm install

# Configure environment (already has .env.local)
# Verify .env.local has correct localhost URLs

# Start dev server
npm start
```

#### Login Page (localhost:5173)
```bash
# Clone and install login page repo
cd ../login-page-repo
npm install

# Create .env.local with Cognito credentials
cat > .env.local << EOF
VITE_USER_POOL_ID=eu-central-1_rS9qXL9Ee
VITE_CLIENT_ID=3t8p938oufoc1pstif4660vhmq
VITE_REGION=eu-central-1
VITE_APP_URL=http://localhost:5174
EOF

# Start dev server
npm start
```

#### Backend API (localhost:8080)
```bash
# Start your Spring Boot backend
# Ensure it's configured for localhost with:
# - Cookie domain: "localhost" (no port)
# - Secure: false
# - CORS: http://localhost:5173 and http://localhost:5174
```

### 2. Production Deployment (AWS Amplify Example)

#### Deploy Main App
```bash
# Build for production
npm run build

# AWS Amplify Configuration
# In Amplify Console > Environment Variables, add:
VITE_BACKEND_URL=http://cognito-app-backend-deploy.eba-3sq3fekp.eu-central-1.elasticbeanstalk.com
VITE_CUSTOM_LOGIN_URL=https://main.d2l13mf6ec69fe.amplifyapp.com
VITE_APP_URL=https://main.d16f2529r3lhi6.amplifyapp.com

# Deploy (Amplify auto-deploys from git push)
git push origin main
```

#### Deploy Login Page
```bash
# In login page repo
npm run build

# AWS Amplify Configuration for Login Page
# In Amplify Console > Environment Variables, add:
VITE_USER_POOL_ID=eu-central-1_rS9qXL9Ee
VITE_CLIENT_ID=3t8p938oufoc1pstif4660vhmq
VITE_REGION=eu-central-1
VITE_APP_URL=https://main.d16f2529r3lhi6.amplifyapp.com

# Deploy
git push origin main
```

#### Backend API Production
Ensure your production backend has:
- **Cookie Settings**:
  - `Secure: true` (HTTPS only)
  - `Domain: ".yourdomain.com"` or specific domain
  - `SameSite: None` or `Lax`
  - `HttpOnly: true`
  
- **CORS Configuration**:
  ```java
  allowedOrigins: 
    - https://main.d2l13mf6ec69fe.amplifyapp.com (login page)
    - https://main.d16f2529r3lhi6.amplifyapp.com (main app)
  allowCredentials: true
  ```

## Verification Checklist

### ✅ Localhost
- [ ] Main app runs on http://localhost:5174
- [ ] Login page runs on http://localhost:5173
- [ ] Backend API runs on http://localhost:8080
- [ ] Can navigate to main app → redirects to login
- [ ] Can login → redirects back to main app with cookies
- [ ] Can see user info on main app
- [ ] Can logout → redirects to clean login page (no returnUrl)

### ✅ Production
- [ ] Environment variables set in deployment platform
- [ ] Main app deployed and accessible
- [ ] Login page deployed and accessible
- [ ] Backend API deployed with HTTPS
- [ ] CORS configured for both app URLs
- [ ] Cookies set with `Secure: true`
- [ ] Full auth flow works end-to-end
- [ ] Logout redirects to clean login page

## Common Issues

### Issue: "Invalid UserPoolId format" on Login Page
**Solution**: Ensure login page has `VITE_USER_POOL_ID` env var set correctly. See [LOGIN_PAGE_CONFIG.md](LOGIN_PAGE_CONFIG.md)

### Issue: Cookies not being set
**Solution**: 
- Localhost: Set cookie domain to `"localhost"` (no port)
- Production: Ensure `Secure: true` and proper domain
- Check CORS `allowCredentials: true`

### Issue: CORS errors
**Solution**: Backend must allow both app URLs in CORS config with `credentials: true`

### Issue: Logout doesn't redirect properly
**Solution**: Ensure `redirectToLogin(false)` is called in logout handler to skip returnUrl

## Environment Variables Reference

| Variable | Localhost | Production | Description |
|----------|-----------|------------|-------------|
| `VITE_BACKEND_URL` | `http://localhost:8080` | `http://cognito-app-backend-deploy.eba-3sq3fekp.eu-central-1.elasticbeanstalk.com` | Backend domain (API path /api/auth is appended in code) |
| `VITE_CUSTOM_LOGIN_URL` | `http://localhost:5173` | `https://login.example.com` | Login page URL |
| `VITE_APP_URL` | `http://localhost:5174` | `https://app.example.com` | Main app URL |
| `VITE_USER_POOL_ID` | `eu-central-1_rS9qXL9Ee` | `eu-central-1_rS9qXL9Ee` | AWS Cognito User Pool ID |
| `VITE_CLIENT_ID` | `3t8p938oufoc1pstif4660vhmq` | `3t8p938oufoc1pstif4660vhmq` | AWS Cognito App Client ID |

## Next Steps

1. ✅ Configure environment variables for your environment
2. ✅ Test localhost setup with all three components running
3. ✅ Deploy to production and set environment variables
4. ✅ Verify full authentication flow
5. ✅ Monitor cookies and CORS in browser DevTools

## Support Files
- [BACKEND_REQUIREMENTS.md](BACKEND_REQUIREMENTS.md) - Backend cookie configuration
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions
- [LOGIN_PAGE_CONFIG.md](LOGIN_PAGE_CONFIG.md) - Login page configuration
