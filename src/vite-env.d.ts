/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string
  readonly VITE_CUSTOM_LOGIN_URL: string
  readonly VITE_APP_URL: string
  readonly VITE_AUTHORITY: string
  readonly VITE_CLIENT_ID: string
  readonly VITE_DOMAIN: string
  readonly VITE_REDIRECT_URI: string
  readonly VITE_RESPONSE_TYPE: string
  readonly VITE_SCOPE: string
  readonly VITE_USER_POOL_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
