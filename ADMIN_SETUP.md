# Admin Tool Setup

## Environment Variables

Add these environment variables to your Vercel project:

### Required Variables

1. **ADMIN_PASSWORD** - The password for admin access
   - Set a strong, secure password

2. **REDIS_URL** - Your Redis connection URL (already configured)
   - Example: `redis://username:password@host:port`

### Optional Variables

3. **JWT_SECRET** - Secret key for signing session tokens (optional)
   - If not provided, a simple session token will be used
   - Example: `your-super-secret-jwt-key-here`

## Accessing the Admin Tool

1. Navigate to `https://your-domain.vercel.app/admin`
2. Enter the admin password
3. View and delete submitted ideas

## Security Features

- Password-protected access
- Session tokens expire after 24 hours
- Timing-safe password comparison
- HTTPS-only (provided by Vercel)
- No admin routes accessible without valid token

## API Endpoints

- `POST /api/admin-auth` - Authenticate with password
- `GET /api/admin-get-ideas` - Get all ideas (requires auth)
- `DELETE /api/admin-delete-idea` - Delete specific idea (requires auth)

## Testing

After deployment, test the following:

- [ ] Can access `/admin` route
- [ ] Login with correct password works
- [ ] Login with wrong password fails
- [ ] Can view all submitted ideas
- [ ] Can delete individual ideas
- [ ] Session persists across page refreshes
- [ ] Logout clears session properly
- [ ] Cannot access admin APIs without authentication
