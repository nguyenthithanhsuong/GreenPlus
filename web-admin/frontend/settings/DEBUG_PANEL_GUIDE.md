# 🔍 User Login Debug Panel - Comprehensive Guide

## Overview
A debug panel has been added to the **Settings page** (Cài đặt tài khoản) to help you verify that user information is being transmitted and saved correctly during login.

## Location
- **File**: `web-admin/frontend/settings/SettingsManagement.tsx`
- **Component**: `UserDebugPanel.tsx`
- **Where to see it**: After logging in, go to the Settings page - you'll see an amber-colored debug panel at the top with a 🔍 icon

## What the Debug Panel Shows

### 1. Auth Store (từ Supabase)
Shows the raw Supabase session data stored in your browser:
- `initialized`: Whether auth has finished loading
- `user.id`: Your Supabase user ID (UUID)
- `user.email`: Your email address from Supabase
- `user.user_metadata`: Additional user data stored in Supabase
- `user.app_metadata`: Role and other app-specific data
- `session.access_token`: Your JWT token (first 20 chars shown for security)
- `session.refresh_token`: Used to refresh expired tokens

### 2. Current User Profile (từ /api/users/me)
Shows the user data fetched from your GreenPlus database:
- `userId`: Your user ID in the database
- `name`: Full name
- `email`: Email address (from database)
- `phone`: Phone number (if filled)
- `address`: Address (if filled)
- `imageUrl`: Avatar image URL
- `roleName`: Your role (Admin, Manager, Employee, etc.)
- `status`: Account status (active, inactive, banned)

### 3. Trạng thái tải dữ liệu (Loading Status)
Quick checklist showing what's loaded:
- ✓ = Working correctly
- ✗ = Not loaded / Problem
- 🔄 = Currently loading

Example output:
```
Auth Initialized: ✓ Có
User từ Session: ✓ Có (your@email.com)
Session Access Token: ✓ Có
Profile từ API: ✓ Có (your@email.com)
Đang tải: ✗ Không
```

### 4. Ánh xạ dữ liệu (Data Mapping)
Shows exactly where each field value comes from:

| Field | Value | Source |
|-------|-------|--------|
| userId | abc-123-def | dbUser.user_id \|\| user.id |
| name | John Doe | DB → user_metadata.full_name |
| email | john@example.com | dbUser.email \|\| user.email |
| phone | +84912345678 | dbUser.phone |
| roleName | Admin | app_metadata.role |
| status | active | dbUser.status |

This table helps you understand the data flow and priority (where it falls back to if a value is missing).

## Data Flow Diagram

```
LOGIN
  ↓
Supabase Authentication
  ↓
Session stored in authStore (indexed db)
  ↓
App initializes → useCurrentUserProfile hook
  ↓
Makes Bearer token request: GET /api/users/me
  ↓
Server-side:
  1. AuthService.verifySession() - validates JWT
  2. UserManagementFacade.findCurrentUser() - fetches from DB
  ↓
Returns UserSummary to frontend
  ↓
Profile displayed in form & debug panel
```

## How to Use the Debug Panel

### Step 1: Log In
1. Go to the admin login page
2. Enter your credentials
3. You should see a session created in Supabase

### Step 2: Navigate to Settings
1. Click on your profile/settings in the navigation
2. Go to "Cài đặt tài khoản" (Settings)
3. Look for the amber debug panel at the top

### Step 3: Expand the Panel
Click on the debug panel header to expand it and see all 4 sections.

### Step 4: Check Each Section
Read through each section and verify:
- ✓ All "✓" marks are present (no "✗")
- All fields have values (no "undefined" or empty)
- Email and names match what you expect

## Troubleshooting

### Problem 1: "Auth Initialized: ✗ Không"
**Cause**: Supabase session not loaded yet
**Solution**: 
- Wait a moment and refresh the page
- Check if you're actually logged in
- Check browser console (F12 → Console) for errors

### Problem 2: "User từ Session: ✗ Không"
**Cause**: Not logged in or session expired
**Solution**:
- Log out and log back in
- Check if your access token has expired
- Clear browser cache and cookies, then log in again

### Problem 3: "Session Access Token: ✗ Không"
**Cause**: Authentication token missing or invalid
**Solution**:
- Refresh the page
- Log out and log in again
- Check if Supabase environment variables are correct (.env.local)

### Problem 4: "Profile từ API: ✗ Không"
**Cause**: /api/users/me endpoint failed or user not in database
**Solution**:
- Check Network tab (F12 → Network) for /api/users/me request
  - If status is 401: Token validation failed
  - If status is 404: User exists in Supabase but not in database
  - If status is 500: Server error
- Check Console (F12 → Console) for error messages
- Make sure your user record exists in the `users` table in Supabase

### Problem 5: Some Fields Are Empty (e.g., phone, address)
**Cause**: Data not filled in database
**Solution**:
- This is normal if you haven't filled these fields yet
- They will appear once you fill them in the form and save
- Check the database to see if the user record has these values

## Advanced Troubleshooting

### Step 1: Open Developer Tools
Press `F12` on your keyboard to open browser DevTools.

### Step 2: Check Network Tab
1. Go to Network tab
2. Refresh the page
3. Look for a request to `/api/users/me`
4. Check the request headers:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. Check the response:
   - **Status 200**: ✓ Working
   - **Status 401**: ✗ Invalid token
   - **Status 404**: ✗ User not in database
   - **Status 500**: ✗ Server error

### Step 3: Check Console Tab
Look for messages like:
- `[DEBUG] User fetched: {user data}` - Good!
- `Error: Unauthorized` - Token problem
- `Error: User profile not found` - Database issue

### Step 4: Check Application Tab
1. Go to Application tab (or Storage)
2. Find "IndexedDB"
3. Look for `supabase` database
4. Check if session data is stored
5. Verify token is not empty

## Database Schema Reference

Your user data comes from these Supabase tables:

### users table
```sql
user_id (UUID) - Primary Key
role_id (UUID) - Foreign Key to roles
name (VARCHAR 100) - Full name
email (VARCHAR 255) - Email address (UNIQUE)
phone (VARCHAR 20) - Optional
address (VARCHAR 255) - Optional
status (VARCHAR 20) - 'active', 'inactive', 'banned'
image_url (TEXT) - Avatar URL
created_at (TIMESTAMP)
```

### Expected Constraints
- `users_pkey`: PRIMARY KEY (user_id)
- `users_email_key`: UNIQUE (email)
- `users_role_id_fkey`: FOREIGN KEY (role_id) REFERENCES roles(role_id)
- `users_status_check`: CHECK (status IN ('active', 'inactive', 'banned'))

## Common Scenarios

### Scenario 1: Everything Shows ✓
✓ = Everything is working correctly! User data is being transmitted and saved properly.

### Scenario 2: Auth but No Profile
- ✓ Auth Initialized
- ✓ User từ Session
- ✗ Profile từ API

This usually means:
- Your account exists in Supabase but not in the GreenPlus database
- Solution: Contact an admin to create your user record

### Scenario 3: No Auth at All
- ✗ Auth Initialized (or still loading)
- ✗ User từ Session

This usually means:
- You're not actually logged in
- Your session has expired
- Solution: Log out completely and log back in

### Scenario 4: Token Present but API Fails
- ✓ Session Access Token
- ✗ Profile từ API (with 401 error in Network tab)

This usually means:
- Your token is invalid or corrupted
- The token format is wrong
- Solution: Refresh the page or log in again

## Developer Notes

### API Endpoint
- **URL**: `/api/users/me`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {access_token}`
- **Response**: 
  ```json
  {
    "item": {
      "user_id": "uuid",
      "name": "User Name",
      "email": "user@example.com",
      "phone": "1234567890",
      "address": "Street Address",
      "image_url": "https://...",
      "role_name": "Admin",
      "status": "active"
    }
  }
  ```

### Code Files
- **Debug Component**: `web-admin/frontend/settings/UserDebugPanel.tsx`
- **Integration**: `web-admin/frontend/settings/SettingsManagement.tsx`
- **useCurrentUserProfile Hook**: `web-admin/frontend/shared/useCurrentUserProfile.ts`
- **Auth Store**: `web-admin/src/lib/stores/authStore.ts`
- **API Route**: `web-admin/src/app/api/users/me/route.ts`
- **Auth Service**: `web-admin/backend/modules/auth/auth.service.ts`
- **User Facade**: `web-admin/backend/modules/users/facades/user-management.facade.ts`

### What Gets Stored Where
1. **Supabase Auth**: user ID, email, metadata
2. **IndexedDB (Browser)**: session token, access token
3. **Memory (authStore)**: current session and user
4. **GreenPlus Database**: user details (name, phone, address, etc.)

## When to Remove Debug Panel

Once everything is working correctly and you've verified the data flow, you can remove the debug panel by:

1. Opening `web-admin/frontend/settings/SettingsManagement.tsx`
2. Removing this line:
   ```tsx
   <UserDebugPanel />
   ```
3. Optionally, delete `web-admin/frontend/settings/UserDebugPanel.tsx`

## Questions?

If you encounter issues that don't match the scenarios above:
1. Take a screenshot of the debug panel
2. Check the Network tab for the `/api/users/me` request
3. Check the Console tab for error messages
4. Look at the backend logs if available
5. Share the debug panel output and network request/response details

---

**Last Updated**: April 28, 2026
**Component**: UserDebugPanel v1.0
