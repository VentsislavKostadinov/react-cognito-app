# Login Page Configuration Guide

## Error: "Invalid UserPoolId format"

This error occurs on your **Custom Login Page** (localhost:5173), not the main app.

## Required Environment Variables for Login Page

Your login page's `.env` or `.env.local` file needs these variables:

```bash
# AWS Cognito User Pool Configuration
VITE_USER_POOL_ID=eu-central-1_rS9qXL9Ee
VITE_CLIENT_ID=3t8p938oufoc1pstif4660vhmq
VITE_REGION=eu-central-1

# Optional: Main app URL for redirect after login
VITE_APP_URL=http://localhost:5174
```

## How to Extract Values from This Project

From this main app's `.env` file:

1. **UserPoolId**: Extract from `VITE_AUTHORITY`
   - Full: `https://cognito-idp.eu-central-1.amazonaws.com/eu-central-1_rS9qXL9Ee`
   - Extract: `eu-central-1_rS9qXL9Ee` (the part after the last `/`)

2. **ClientId**: Use `VITE_CLIENT_ID` directly
   - Value: `3t8p938oufoc1pstif4660vhmq`

3. **Region**: Extract from UserPoolId
   - Value: `eu-central-1` (the part before the `_`)

## Example cognitoService.ts Setup

Your login page's `cognitoService.ts` should look like this:

```typescript
import { CognitoUserPool } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: import.meta.env.VITE_USER_POOL_ID,
  ClientId: import.meta.env.VITE_CLIENT_ID,
};

const userPool = new CognitoUserPool(poolData);

export default userPool;
```

## Local Development Setup

**For Login Page (localhost:5173):**
Create `.env.local`:
```bash
VITE_USER_POOL_ID=eu-central-1_rS9qXL9Ee
VITE_CLIENT_ID=3t8p938oufoc1pstif4660vhmq
VITE_REGION=eu-central-1
VITE_APP_URL=http://localhost:5174
```

**For Main App (localhost:5174) - Already configured:**
- Uses `.env.local` for backend API URLs
- Uses `.env` for Cognito settings

## Production Deployment

**Login Page Production `.env`:**
```bash
VITE_USER_POOL_ID=eu-central-1_rS9qXL9Ee
VITE_CLIENT_ID=3t8p938oufoc1pstif4660vhmq
VITE_REGION=eu-central-1
VITE_APP_URL=https://main.d16f2529r3lhi6.amplifyapp.com
```

## Quick Fix

1. Navigate to your login page project directory
2. Create `.env.local` with the values above
3. Restart the dev server (`npm start`)
4. The error should be resolved
