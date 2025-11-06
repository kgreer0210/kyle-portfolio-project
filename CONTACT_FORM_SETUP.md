# Contact Form Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Email Service Configuration
# Get your API key from: https://resend.com/api-keys
RESEND_API_KEY=re_your_resend_api_key_here

# Contact Email
# Email address where contact form submissions will be sent
CONTACT_EMAIL=kygrsolutions@gmail.com
```

**Note:** reCAPTCHA is no longer required! The form now uses honeypot fields and rate limiting for spam protection.

## Setup Steps

### 1. Configure Email Service (Resend)

#### Step-by-Step Resend Setup for Testing

1. **Sign up for Resend**

   - Go to [https://resend.com](https://resend.com)
   - Click "Sign Up" and create a free account (100 emails/day free tier)
   - Verify your email address

2. **Get Your API Key**

   - After logging in, go to [API Keys](https://resend.com/api-keys)
   - Click "Create API Key"
   - Give it a name (e.g., "Portfolio Contact Form")
   - Copy the API key (starts with `re_` - you'll only see it once!)
   - Add it to your `.env.local` file:
     ```env
     RESEND_API_KEY=re_your_actual_api_key_here
     ```

3. **Testing Configuration (No Domain Verification Needed)**

   - Resend allows you to send test emails using their default domain: `onboarding@resend.dev`
   - The API route is already configured to use this for testing
   - **Important**: You can send TO any email (including `kygrsolutions@gmail.com`), but you must send FROM Resend's testing domain
   - Emails will show as coming from `Contact Form <onboarding@resend.dev>` but will be delivered to `kygrsolutions@gmail.com`

4. **Testing Your Setup**
   - Start your dev server: `npm run dev`
   - Navigate to the contact form on your portfolio
   - Fill out and submit the form
   - Check your `kygrsolutions@gmail.com` inbox (also check spam folder initially)
   - You should receive the contact form submission email

#### Production Setup (Optional - For Custom "From" Address)

If you want emails to come from your own domain (e.g., `contact@yourdomain.com`):

1. **Verify Your Domain in Resend**

   - Go to [Domains](https://resend.com/domains) in Resend dashboard
   - Click "Add Domain"
   - Enter your domain name (e.g., `yourdomain.com`)
   - Add the DNS records Resend provides to your domain's DNS settings
   - Wait for verification (usually takes a few minutes)

2. **Update the API Route**
   - Once verified, update `src/app/api/contact/route.ts`:
     ```typescript
     from: "Contact Form <contact@yourdomain.com>",
     ```

**Note**: For testing, you don't need to verify a domain. The current setup will work perfectly for testing with `kygrsolutions@gmail.com` as the recipient!

### 2. Spam Protection

The contact form includes built-in spam protection:

- **Honeypot Field**: A hidden field that bots often fill out. If filled, the submission is silently rejected.
- **Rate Limiting**: Limits submissions to 5 per 15 minutes per IP address to prevent abuse.

No additional configuration needed - these protections work automatically!

## Testing

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Navigate to the contact section on your portfolio
3. Fill out the form and submit
4. Check your email inbox for the notification

## n8n Cloud Integration

After receiving emails via Resend, you can configure n8n Cloud to:

- Monitor your inbox for new contact form emails
- Send automated acknowledgment emails to senders
- Store submissions in a database
- Trigger other workflows

## Troubleshooting

- **Email not sending**: Check that `RESEND_API_KEY` is set correctly and your domain is verified in Resend
- **Rate limit errors**: The form limits submissions to 5 per 15 minutes per IP. This is normal protection against spam
- **Build errors**: Make sure all environment variables are set before building
