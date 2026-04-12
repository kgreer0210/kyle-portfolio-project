# Passkey Integration — Next Steps

## 1. Environment Variables

Add the following to your `.env.local` (and to your Vercel/hosting environment):

```env
WEBAUTHN_RP_ID=yourdomain.com
WEBAUTHN_RP_NAME="Kyle Greer Portal"
WEBAUTHN_ORIGIN=https://yourdomain.com
WEBAUTHN_CHALLENGE_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

For local development use:
```env
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:3000
```

> **Important:** `WEBAUTHN_RP_ID` must exactly match the domain of the page serving the login — no port, no protocol. On localhost this is literally `localhost`.

---

## 2. Run the Database Migration

Apply the new migration to your Supabase project:

```bash
supabase db push
# or via the Supabase dashboard: SQL Editor → paste supabase/migrations/20260412000000_create_webauthn_schema.sql
```

---

## 3. Test Registration Flow

1. Log in with a password account
2. Navigate to `/portal/settings/security`
3. Click **Add passkey** and complete the authenticator prompt
4. Verify the credential appears in the list with a creation date

---

## 4. Test Authentication Flow

1. Sign out
2. On the login page, click **Sign in with a passkey**
3. Complete the authenticator prompt
4. Verify you land on `/portal` or `/admin` based on your role

---

## 5. Test Edge Cases

- [ ] **Replay protection:** Resubmit the same authentication assertion — should return 400
- [ ] **Expired challenge:** Wait >5 minutes between options and verify requests — should return 400
- [ ] **Credential deletion:** Remove a passkey from settings, confirm it can no longer be used
- [ ] **Duplicate registration:** Attempt to register the same device twice — should be blocked by `excludeCredentials`
- [ ] **RLS check:** Confirm a user cannot read or delete another user's credentials via the API

---

## 6. Add a Link to Settings in the Portal Nav

The `/portal/settings/security` page exists but is not yet linked from the portal navigation. Add a **Security** link wherever your portal sidebar/header lives so users can discover it.

---

## 7. Optional Enhancements

### Friendly Names on Registration
Prompt the user for a device name (e.g. "Work MacBook") immediately after a successful registration rather than relying on the rename flow post-hoc. Add a `friendly_name` input to the `PasskeyRegistration` component and pass it in the verify request body.

### Email-Targeted Auth (Non-Discoverable Flow)
The authenticate options route already supports `{ email }` in the request body to populate `allowCredentials`. Wire up an optional email input in `PasskeyLogin.tsx` for devices that don't support resident keys.

### Passkey Indicator on Login Page
If the browser supports WebAuthn (`PublicKeyCredential` in `window`), show the passkey button. If not, hide it. Add a `useEffect` check in `PasskeyLogin.tsx`:
```ts
const [supported, setSupported] = useState(false);
useEffect(() => { setSupported(typeof window !== 'undefined' && !!window.PublicKeyCredential); }, []);
if (!supported) return null;
```

### Rate Limiting
Add rate limiting to the public `authenticate/options` and `authenticate/verify` routes to prevent credential enumeration. Consider Upstash Ratelimit or a simple in-memory counter behind a middleware check.

### Audit Log
Log passkey sign-in events (user ID, timestamp, credential ID, IP) to a Supabase table for security auditing.

### AAGUID Lookup
Use the [FIDO MDS](https://mds.fidoalliance.org/) or a community AAGUID list to display a human-readable authenticator name (e.g. "iCloud Keychain", "YubiKey 5") alongside each credential in the settings list.

---

## 8. Production Checklist

- [ ] `WEBAUTHN_RP_ID` matches your production domain exactly
- [ ] `WEBAUTHN_ORIGIN` matches your production origin exactly (including `https://`)
- [ ] `WEBAUTHN_CHALLENGE_SECRET` is a unique 32-byte random value — not shared with other secrets
- [ ] Migration has been applied to the production Supabase project
- [ ] Settings security page is linked from the portal UI
