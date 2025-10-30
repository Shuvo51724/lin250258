# ⚠️ IMMEDIATE ACTION REQUIRED - License System Setup

## The Application Will NOT Start Without Environment Variables

The license activation system requires secure environment variables to be set before the server will start.

## Quick Setup (2 minutes)

### Step 1: Generate Secrets

Run this command to generate secure random secrets:

```bash
tsx scripts/generate-secrets.ts
```

This will output something like:

```
LICENSE_JWT_SECRET=e3dfc0722e6431597a1db282d1d65844...
MANIFEST_SECRET=aa9ad0b5d0c0745f6b5d9a1bf75ade68...
MASTER_KEY_HASHES=2391895c2abb3e5aba73deaa8a8b7f4a35fef18d6320166ca8cd82c98052b03d
TOKEN_EXPIRY=1y
```

### Step 2: Add to Replit Secrets

1. Click on "Tools" → "Secrets" (lock icon) in Replit sidebar
2. Add each of these variables:
   - `LICENSE_JWT_SECRET` = (the generated hex string)
   - `MANIFEST_SECRET` = (the generated hex string)
   - `MASTER_KEY_HASHES` = (the generated hash)
   - `TOKEN_EXPIRY` = `1y` (optional)

### Step 3: Restart the Server

After adding the secrets, restart the workflow and the server will start normally.

## Default Master Key

The default master key for activation is:
```
ava-I-can-never-tell-you
```

This key's hash is already included in the generated `MASTER_KEY_HASHES`.

## What Happens After Setup

1. When users visit the app, they'll see an **Activation Screen**
2. They enter the master key: `ava-I-can-never-tell-you`
3. Upon successful activation, they can access the login screen
4. The license is validated server-side and a signed JWT token is issued
5. Features are enabled/disabled based on license validity

## Admin Access

After activation and login as admin:
- Visit `/license-admin` to manage licenses
- View activation logs
- Monitor tamper reports
- Revoke licenses if needed

## For Complete Documentation

See `LICENSE_SETUP.md` for:
- Full API documentation
- Security best practices
- Production deployment checklist
- Troubleshooting guide
- Migration to PostgreSQL

## Need Help?

If the server fails to start, check:
1. All 3 required environment variables are set in Replit Secrets
2. The secrets are the full hex strings (64+ characters)
3. MASTER_KEY_HASHES contains at least one hash

## Security Note

**These secrets are critical for security:**
- Never commit them to git
- Never share them publicly
- Use different secrets for dev/staging/production
- Rotate them periodically

---

After completing setup, you can delete this file.
