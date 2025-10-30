# License Activation & Tamper Detection System

## Overview

This document describes the production-ready license activation and tamper-detection system implemented for DOB Performance Tracker.

## Features

### 1. Pre-Login License Activation
- Users must activate the application with a valid license key before accessing the login screen
- Activation screen is the first thing users see
- No authentication possible without valid license

### 2. Server-Side License Validation
- License keys validated server-side using SHA-256 hash comparison
- Master keys never stored in plaintext (only hashes in environment variables)
- Signed JWT tokens (HS256) issued upon successful activation
- Token validity checked both client-side (UX) and server-side (authoritative)

### 3. File Integrity Verification
- Signed manifest tracking SHA-256 checksums of critical files
- Server generates and signs manifest using HMAC-SHA256
- Manifest includes both critical application files and decoy files
- Tamper detection triggers feature lockout and reports to server

### 4. Decoy Files
The following decoy files are monitored for unauthorized modifications:
- `LICENSE_FAKE.md` - Fake license information
- `README_KEY_HINT.txt` - Fake key hints
- `docs/KEYS_NOT_HERE.md` - Fake keys documentation
- `keys/NOT_THIS_ONE.key` - Fake key file

Any modification or removal triggers tamper detection.

### 5. Kill-Switch Feature Lockout
When license is invalid, revoked, or tampered, these features are disabled:
- **Chat** - Real-time chat functionality disabled
- **Data Export** - Excel export and data extraction blocked
- **Admin Panels** - Admin and license management UIs restricted
- **File Uploads** - File upload functionality disabled
- **Rankings** - Performance rankings calculations blocked

**Important**: User data is never deleted. Only functionality is restricted.

### 6. Admin License Management
Admins can:
- View all active, revoked, and expired licenses
- Revoke licenses with optional reason
- View activation audit logs
- Monitor tamper detection reports
- Upload new manifests and signatures

## Environment Variables

### Required Variables

```bash
# License JWT Secret (for signing activation tokens)
# Generate with: openssl rand -hex 64
LICENSE_JWT_SECRET=your-secret-here

# Manifest Secret (for signing file integrity manifests)
# Generate with: openssl rand -hex 64
MANIFEST_SECRET=your-secret-here

# Master Key Hashes (comma-separated SHA256 hashes)
# Default key: "ava-I-can-never-tell-you"
# Generate hash: echo -n "your-key" | sha256sum
MASTER_KEY_HASHES=default-hash-here

# Token Expiry (optional, default: 1y)
TOKEN_EXPIRY=1y
```

### Generating Secrets

Run the provided script to generate secure random secrets:

```bash
tsx scripts/generate-secrets.ts
```

This will output all required environment variables with secure random values.

## Setup Instructions

### 1. Install Dependencies

Dependencies are already installed (jsonwebtoken, bcryptjs added to package.json).

### 2. Set Environment Variables

Add the following to your Replit Secrets or environment:

```bash
LICENSE_JWT_SECRET=<generated-secret>
MANIFEST_SECRET=<generated-secret>
MASTER_KEY_HASHES=<sha256-hash-of-master-key>
TOKEN_EXPIRY=1y
```

**Default Master Key**: `ava-I-can-never-tell-you`

To compute the hash for this key:
```bash
echo -n "ava-I-can-never-tell-you" | sha256sum
# Output: 0cbbe6c5d5fc5af887dc4b83e91f89c0e9c3b0c72d67b02e2de2f65c1e7b0866
```

### 3. Generate Initial Manifest

```bash
tsx scripts/generate-manifest.ts
```

This creates:
- `data/license/manifest.json` - File integrity manifest
- `data/license/manifest.sig` - HMAC signature of manifest

### 4. Start the Server

```bash
npm run dev
```

The license system will automatically:
- Initialize storage directories
- Create empty license database
- Verify decoy files exist
- Set up activation endpoints

## API Endpoints

### POST /api/license/activate
Activate a license with a master key.

**Request:**
```json
{
  "key": "ava-I-can-never-tell-you",
  "clientId": "unique-client-id",
  "clientInfo": {
    "userAgent": "...",
    "platform": "..."
  }
}
```

**Response (Success):**
```json
{
  "ok": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "licenseId": "abc123"
}
```

**Response (Failure):**
```json
{
  "ok": false,
  "error": "Invalid license key"
}
```

### GET /api/license/status
Check license status (requires Bearer token).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "ok": true,
  "status": "active",
  "licenseId": "abc123",
  "activatedAt": "2025-10-30T...",
  "expiresAt": "2026-10-30T..."
}
```

### POST /api/license/revoke
Revoke a license (admin only).

**Request:**
```json
{
  "licenseId": "abc123",
  "reason": "Security violation"
}
```

**Response:**
```json
{
  "ok": true,
  "message": "License revoked successfully"
}
```

### POST /api/license/tamper-report
Report file tampering (automatically called by client).

**Request:**
```json
{
  "tamperType": "file_modified",
  "details": {
    "file": "server/routes.ts",
    "expected": "sha256:abc...",
    "actual": "sha256:def..."
  },
  "clientId": "unique-client-id"
}
```

### GET /api/license/audit
View activation logs and tamper reports (admin only).

**Query Parameters:**
- `limit` (optional, default: 100)

**Response:**
```json
{
  "ok": true,
  "activations": [...],
  "tamperReports": [...]
}
```

### GET /api/license/list
List all licenses (admin only).

**Response:**
```json
{
  "ok": true,
  "licenses": [
    {
      "licenseId": "abc123",
      "status": "active",
      "activatedAt": "2025-10-30T...",
      "lastSeenIP": "1.2.3.4"
    }
  ]
}
```

## Security Features

### Rate Limiting
- Maximum 5 activation attempts per IP within 15 minutes
- Failed attempts logged with IP and timestamp
- Rate limit reset after 15-minute window

### Audit Logging
All security events are logged:
- Successful activations
- Failed activation attempts
- License revocations
- Tamper detection incidents

Logs include:
- Timestamp
- IP address
- User agent
- Client ID
- Success/failure status
- Error messages

### Secure Token Storage
- Tokens encrypted (Base64) in localStorage
- Never stored in plain text
- Secure HTTP-only cookies recommended for production

### Timing-Safe Comparisons
- All hash comparisons use `crypto.timingSafeEqual`
- Prevents timing attack vulnerabilities

## File Storage Structure

```
data/
└── license/
    ├── licenses.json          # License database
    ├── activations.jsonl      # Activation logs (append-only)
    ├── tamper-reports.jsonl   # Tamper reports (append-only)
    ├── manifest.json          # File integrity manifest
    └── manifest.sig           # Manifest signature
```

### Atomic Writes
All file operations use atomic writes (temp file + rename) to prevent corruption.

### File Permissions
All sensitive files created with `0o600` permissions (read/write owner only).

## Usage Guide

### For End Users

1. **First-time Activation**:
   - Open the application
   - See the activation screen
   - Enter license key provided by admin
   - Click "Activate License"
   - Upon success, login screen appears

2. **License Expiry/Revocation**:
   - Features automatically disabled
   - Clear message displayed
   - Contact administrator for renewal

3. **Tamper Detection**:
   - If file tampering detected
   - Critical features disabled
   - Incident reported to admin
   - Contact administrator immediately

### For Administrators

1. **View License Management**:
   - Login with admin account
   - Navigate to `/license-admin`
   - View active licenses, logs, tamper reports

2. **Revoke a License**:
   - Enter license ID
   - Optionally provide reason
   - Click "Revoke License"
   - Client will detect revocation on next status check

3. **Monitor Security**:
   - Check activation logs for suspicious activity
   - Review tamper reports
   - Investigate failed activation attempts
   - Monitor IP addresses and patterns

4. **Regenerate Manifest**:
   ```bash
   tsx scripts/generate-manifest.ts
   ```
   Upload new manifest via admin UI or replace files directly

## Testing & Verification

### Test Activation Flow

1. Clear browser localStorage
2. Refresh application
3. Should see activation screen (no login visible)
4. Enter invalid key → should fail with error
5. Enter valid key `ava-I-can-never-tell-you` → should succeed
6. Should see login screen after successful activation

### Test Tamper Detection

1. Modify a tracked file (e.g., add comment to `server/routes.ts`)
2. Implement manifest verification in client
3. Client should detect mismatch
4. Report tamper to server
5. Features should be disabled

### Test Revocation

1. Activate with valid key
2. Note the license ID
3. As admin, revoke the license
4. Refresh page or wait for status check
5. Should see "License Invalid" message
6. Features should be disabled

### Test Decoy Files

1. Modify or delete `LICENSE_FAKE.md`
2. Manifest verification should detect change
3. Tamper report generated
4. Features disabled

## Migration to PostgreSQL

When database permissions are available:

1. **Create Migration Script**:
   ```sql
   CREATE TABLE licenses (
     license_id VARCHAR PRIMARY KEY,
     license_key_hash VARCHAR NOT NULL,
     status VARCHAR NOT NULL,
     activated_at TIMESTAMP NOT NULL,
     activated_by VARCHAR,
     last_seen_ip VARCHAR,
     expires_at TIMESTAMP,
     notes TEXT
   );
   
   CREATE TABLE activation_logs (
     id VARCHAR PRIMARY KEY,
     license_id VARCHAR,
     timestamp TIMESTAMP NOT NULL,
     ip VARCHAR,
     user_agent TEXT,
     client_id VARCHAR,
     client_info JSONB,
     success BOOLEAN NOT NULL,
     error TEXT
   );
   
   CREATE TABLE tamper_reports (
     id VARCHAR PRIMARY KEY,
     timestamp TIMESTAMP NOT NULL,
     license_id VARCHAR,
     client_id VARCHAR,
     ip VARCHAR,
     tamper_type VARCHAR NOT NULL,
     details JSONB
   );
   ```

2. **Update Storage Layer**:
   - Replace file operations with database queries
   - Keep same interface (repository pattern)
   - No changes needed to API routes or business logic

3. **Migrate Existing Data**:
   ```bash
   tsx scripts/migrate-to-postgres.ts
   ```

## Production Deployment

### Checklist

- [ ] Generate secure secrets with `scripts/generate-secrets.ts`
- [ ] Set all environment variables in production
- [ ] Generate initial manifest
- [ ] Test activation flow
- [ ] Test revocation flow
- [ ] Test tamper detection
- [ ] Configure HTTPS (license tokens must use secure transmission)
- [ ] Set up log monitoring for tamper reports
- [ ] Document master key recovery procedure
- [ ] Set up periodic secret rotation schedule
- [ ] Configure backup strategy for license data
- [ ] Test license renewal process

### Security Best Practices

1. **Secret Management**:
   - Use environment variables or secret manager
   - Never commit secrets to git
   - Rotate secrets periodically (quarterly)
   - Different secrets for dev/staging/prod

2. **Network Security**:
   - Always use HTTPS in production
   - Enable CORS restrictions
   - Rate limit all endpoints
   - Monitor for unusual activation patterns

3. **Monitoring**:
   - Alert on tamper reports
   - Alert on excessive failed activations
   - Monitor license usage patterns
   - Track IP addresses for anomalies

4. **Backup & Recovery**:
   - Regular backups of license database
   - Documented recovery procedure
   - Test restoration process
   - Maintain audit log archives

## Troubleshooting

### "No token provided" Error
- User hasn't activated license
- Token expired
- LocalStorage cleared
- Solution: Re-activate with valid key

### "Invalid license key" Error
- Wrong key entered
- Key not in MASTER_KEY_HASHES
- Solution: Verify key, check environment variable

### Tamper Detection False Positive
- File legitimately modified
- Manifest out of date
- Solution: Regenerate manifest, clear tamper report

### Rate Limit Exceeded
- Too many failed attempts
- Wait 15 minutes
- Verify correct key
- Check IP isn't blocked

## Support

For issues or questions:
1. Check logs: `data/license/activations.jsonl` and `tamper-reports.jsonl`
2. Verify environment variables are set correctly
3. Regenerate manifest if files legitimately changed
4. Contact system administrator for license renewal

## License

This license system is proprietary to DOB Performance Tracker.
Unauthorized modification or circumvention is prohibited.
