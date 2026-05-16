# Backend Requirements for HttpOnly Cookie Authentication

## Overview
Your React app now uses **HttpOnly cookies** for authentication. This means the Spring Boot backend must properly configure cookies and CORS.

---

## 1. Spring Boot Cookie Configuration

### Login Endpoint (`/api/auth/login`)

After successful authentication, set HttpOnly cookies:

```java
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletResponse response) {
    // Authenticate user and get tokens
    AuthResponse authResponse = authService.login(request.getEmail(), request.getPassword());
    
    // Set Access Token Cookie
    Cookie accessTokenCookie = new Cookie("accessToken", authResponse.getAccessToken());
    accessTokenCookie.setHttpOnly(true);
    accessTokenCookie.setSecure(false); // Set to false for localhost development
    accessTokenCookie.setPath("/");
    accessTokenCookie.setDomain("localhost"); // CRITICAL: Set domain to "localhost" without port
    accessTokenCookie.setMaxAge(authResponse.getExpiresIn());
    response.addCookie(accessTokenCookie);
    
    // Set ID Token Cookie
    Cookie idTokenCookie = new Cookie("idToken", authResponse.getIdToken());
    idTokenCookie.setHttpOnly(true);
    idTokenCookie.setSecure(false);
    idTokenCookie.setPath("/");
    idTokenCookie.setDomain("localhost"); // CRITICAL: Set domain to "localhost" without port
    idTokenCookie.setMaxAge(authResponse.getExpiresIn());
    response.addCookie(idTokenCookie);
    
    // Set Refresh Token Cookie
    Cookie refreshTokenCookie = new Cookie("refreshToken", authResponse.getRefreshToken());
    refreshTokenCookie.setHttpOnly(true);
    refreshTokenCookie.setSecure(false);
    refreshTokenCookie.setPath("/");
    refreshTokenCookie.setDomain("localhost"); // CRITICAL: Set domain to "localhost" without port
    refreshTokenCookie.setMaxAge(30 * 24 * 60 * 60); // 30 days
    response.addCookie(refreshTokenCookie);
    
    // Return user data (but NOT the tokens in the body - they're in cookies now)
    return ResponseEntity.ok(authResponse);
}
```

**IMPORTANT for Multi-Port Localhost:**
Setting `cookie.setDomain("localhost")` (without specifying a port) allows the cookies to be sent to **any** `localhost:<port>`. This is essential when:
- Login page runs on `localhost:5173`
- React app runs on `localhost:5174`
- Backend API runs on `localhost:8080`

All three can share the same cookies this way.

### User Info Endpoint (`/api/auth/user`)

Read the access token from cookies:

```java
@GetMapping("/user")
public ResponseEntity<?> getUserInfo(@CookieValue("accessToken") String accessToken) {
    if (accessToken == null || accessToken.isEmpty()) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No access token found");
    }
    
    // Validate token and get user info
    UserInfo userInfo = authService.getUserInfo(accessToken);
    return ResponseEntity.ok(userInfo);
}
```

### Logout Endpoint (`/api/auth/logout`)

Clear all authentication cookies:

```java
@PostMapping("/logout")
public ResponseEntity<?> logout(HttpServletResponse response) {
    // Clear Access Token
    Cookie accessTokenCookie = new Cookie("accessToken", null);
    accessTokenCookie.setHttpOnly(true);
    accessTokenCookie.setSecure(false);
    accessTokenCookie.setPath("/");
    accessTokenCookie.setDomain("localhost"); // Must match login domain setting
    accessTokenCookie.setMaxAge(0);
    response.addCookie(accessTokenCookie);
    
    // Clear ID Token
    Cookie idTokenCookie = new Cookie("idToken", null);
    idTokenCookie.setHttpOnly(true);
    idTokenCookie.setSecure(false);
    idTokenCookie.setPath("/");
    idTokenCookie.setDomain("localhost"); // Must match login domain setting
    idTokenCookie.setMaxAge(0);
    response.addCookie(idTokenCookie);
    
    // Clear Refresh Token
    Cookie refreshTokenCookie = new Cookie("refreshToken", null);
    refreshTokenCookie.setHttpOnly(true);
    refreshTokenCookie.setSecure(false);
    refreshTokenCookie.setPath("/");
    refreshTokenCookie.setDomain("localhost"); // Must match login domain setting
    refreshTokenCookie.setMaxAge(0);
    response.addCookie(refreshTokenCookie);
    
    return ResponseEntity.ok("Logged out successfully");
}
```

---

## 2. CORS Configuration

Since your login page (`http://localhost:5173`), React app (`http://localhost:5174`), and Spring API (`http://localhost:8080`) run on different ports, you need to enable CORS **with credentials** for both frontend origins.

### WebConfig for CORS

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                    "http://localhost:5173",  // Login page
                    "http://localhost:5174"   // React app
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true); // CRITICAL: Must be true for cookies to work
    }
}
```

### Or use `@CrossOrigin` annotation

```java
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(
    origins = {"http://localhost:5173", "http://localhost:5174"}, 
    allowCredentials = "true"
)
public class AuthController {
    // ...
}
```

---

## 3. Important Notes

### For Development (localhost)

If running on `http://localhost` (not HTTPS):
- Set `cookie.setSecure(false)` 
- Browsers allow non-secure cookies on localhost

### For Production (HTTPS)

When deploying:
- **MUST use HTTPS** for both frontend and backend
- Set `cookie.setSecure(true)`
- Configure proper domain in `cookie.setDomain()`
- If using `SameSite=None`, HTTPS is **required**

### SameSite Attribute

For cross-domain cookies (frontend and backend on different domains):

```java
// Spring Boot 2.6+ supports SameSite
@Bean
public CookieSameSiteSupplier applicationCookieSameSiteSupplier() {
    return CookieSameSiteSupplier.ofNone(); // or ofLax(), ofStrict()
}
```

Or set manually:
```java
response.setHeader("Set-Cookie", 
    "accessToken=" + token + 
    "; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=" + maxAge);
```

---

## 4. Security Best Practices

✅ **DO:**
- Use `HttpOnly=true` (prevents XSS attacks)
- Use `Secure=true` in production (HTTPS only)
- Use short expiration for access tokens (15-60 minutes)
- Use longer expiration for refresh tokens (7-30 days)
- Validate tokens on every protected endpoint
- Clear cookies on logout

❌ **DON'T:**
- Store tokens in localStorage (vulnerable to XSS)
- Use `SameSite=None` without `Secure=true`
- Allow wildcard `*` CORS origin with credentials
- Return tokens in response body when using HttpOnly cookies

---

## 5. Testing

### Check Cookies in Browser DevTools

1. Login via the React app
2. Open Browser DevTools → Application/Storage → Cookies
3. You should see:
   - `accessToken` (HttpOnly ✓, Secure ✓)
   - `idToken` (HttpOnly ✓, Secure ✓)
   - `refreshToken` (HttpOnly ✓, Secure ✓)

### Verify Cookies are Sent

1. Open Network tab in DevTools
2. Make a request to `/api/auth/user`
3. Check Request Headers → should include `Cookie: accessToken=...`
4. JavaScript **cannot** read these cookies (that's the point!)

---

## 6. Troubleshooting

### Cookies not being set?
- Check CORS is configured with `allowCredentials(true)`
- Check React app uses `credentials: 'include'` in fetch requests
- Check backend `response.addCookie()` is called

### Cookies not being sent across different localhost ports?
**CRITICAL FIX:** If your apps run on different ports (e.g., login on :5173, React on :5174, API on :8080):
- Set `cookie.setDomain("localhost")` (without port number) in your backend
- Set `cookie.setSecure(false)` for local development (secure requires HTTPS)
- This allows cookies to be shared across all `localhost:<any-port>`
- **Without this**, cookies set on :5173 won't be sent to :5174!

### Still redirecting to login after successful authentication?
- Check browser DevTools → Application → Cookies
- Verify cookies show `Domain: localhost` (not `localhost:5173` or specific port)
- Verify cookies appear under the domain your React app runs on
- Check Network tab to confirm cookies are being sent with `/api/auth/user` request

### Cookies not being sent?
- Verify `credentials: 'include'` in all fetch calls
- Check `SameSite` attribute allows cross-domain
- Ensure frontend and backend URLs match CORS configuration

### 401 Unauthorized errors?
- Check cookie names match (`accessToken`, `idToken`, etc.)
- Verify tokens are not expired
- Check `@CookieValue` annotation in backend
- Verify CORS allows the origin making the request

---

## Summary

Your React app now:
✅ Stores tokens in **HttpOnly cookies** (secure, not accessible by JavaScript)
✅ Sends cookies automatically with `credentials: 'include'`
✅ Bypasses AWS Cognito hosted UI completely
✅ Uses your custom Spring Boot backend exclusively

The backend must:
✅ Set HttpOnly cookies after login
✅ Read cookies from requests
✅ Clear cookies on logout
✅ Enable CORS with credentials
