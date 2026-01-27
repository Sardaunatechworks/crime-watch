# Email Notification System Setup Guide

## Overview

The Crime Watch application now includes real-time email notifications that alert admins when crimes are reported. Admins also receive status update emails when incident statuses change.

## Features

✅ **Admin Alert Notifications** - Sends detailed crime report alerts to all configured admin emails  
✅ **Status Update Emails** - Notifies reporters when incident status changes  
✅ **Professional HTML Templates** - Formatted emails with incident details and action buttons  
✅ **Async Non-blocking** - Email sending doesn't block incident creation  
✅ **Multiple Admin Support** - Configure multiple admin emails for notifications

## Configuration Steps

### 1. Choose Email Provider

Select an SMTP provider based on your needs:

#### Gmail (Free, Good for Testing)

- **Host**: `smtp.gmail.com`
- **Port**: `587` or `465`
- **Setup**:
  1. Enable 2-Factor Authentication on your Google account
  2. Generate an "App Password": https://myaccount.google.com/apppasswords
  3. Use your email and the generated app password

#### Outlook/Office 365

- **Host**: `smtp-mail.outlook.com`
- **Port**: `587`
- **Setup**: Use your Microsoft account email and password

#### SendGrid (Production Recommended)

- **Host**: `smtp.sendgrid.net`
- **Port**: `587`
- **Setup**:
  1. Create free account at https://sendgrid.com
  2. Create API key
  3. Use `apikey` as username, API key as password

#### AWS SES

- **Host**: `email-smtp.[your-region].amazonaws.com`
- **Port**: `587`
- **Setup**: Verify sender email in SES Console

### 2. Update Environment Variables

Edit `.env.local` and configure:

```env
# SMTP Email Configuration
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-email@gmail.com
VITE_SMTP_PASSWORD=your-app-password
VITE_SMTP_FROM=noreply@crimewatch.app

# Admin Email Recipients (comma-separated)
VITE_ADMIN_EMAILS=admin@mail.com,admin2@mail.com

# Application URL (used in email templates)
VITE_APP_URL=http://localhost:5173
```

### 3. Important Security Notes

⚠️ **Never commit `.env.local` to version control**

- Add to `.gitignore` (already done if using standard setup)
- Use environment variables in production

⚠️ **For Production Deployment**

- Use service-to-service SMTP (SendGrid, AWS SES)
- Never hardcode credentials
- Use production email service API keys
- Update `VITE_APP_URL` to your production domain

### 4. Test Email Configuration

The email service includes a test function. Add this to your App.tsx temporarily to verify:

```typescript
import { emailService } from "./services/email";

// In your component
useEffect(() => {
  emailService.testConnection().then((result) => {
    if (result) console.log("✅ Email configured correctly");
    else console.error("❌ Email configuration failed");
  });
}, []);
```

## How It Works

### When Crime is Reported

1. User submits crime report via `IncidentForm`
2. `dbService.addIncident()` creates incident in Supabase
3. After successful creation, `emailService.sendCrimeReportAlert()` is called
4. Email sent to all admin emails with:
   - Crime title and category
   - Location details
   - Reporter email
   - Full description
   - Case reference number
   - Link to dashboard

### When Status Updates

1. Admin changes incident status via Dashboard
2. `dbService.updateIncidentStatus()` updates database
3. `emailService.sendStatusUpdateEmail()` sends notification to reporter
4. Reporter receives email with:
   - Case reference
   - New status
   - Original report summary
   - Confirmation of investigation progress

## Code Integration

### services/email.ts

- `sendCrimeReportAlert(incident)` - Sends admin notifications
- `sendStatusUpdateEmail(incident, newStatus)` - Sends reporter updates
- `testConnection()` - Verifies SMTP configuration

### services/db.ts

- Modified `addIncident()` to trigger email notifications
- Modified `updateIncidentStatus()` to notify reporters

## Troubleshooting

### Emails Not Sending

**Check 1**: SMTP credentials in `.env.local`

```bash
# Verify values are set
echo $VITE_SMTP_HOST
echo $VITE_SMTP_USER
```

**Check 2**: Admin emails configured

```env
VITE_ADMIN_EMAILS=admin@mail.com,admin2@mail.com  # ✅ Comma-separated
VITE_ADMIN_EMAILS=admin@mail.com ; admin2@mail.com  # ❌ Wrong format
```

**Check 3**: Firewall/Port access

- Port 587 must be accessible
- Check if ISP blocks SMTP
- Try port 465 if 587 blocked

**Check 4**: SMTP Provider Restrictions

- Gmail: Verify "Less secure app access" enabled OR use App Password
- Office 365: May require certificate validation
- SES: Verify sender email address in AWS Console

### Gmail Specific Issues

If getting "Invalid credentials":

1. Verify 2FA enabled: https://myaccount.google.com/security
2. Generate new App Password: https://myaccount.google.com/apppasswords
3. Use full email (with @gmail.com)
4. Paste exact app password (remove spaces)

### Testing in Development

Add temporary test endpoint:

```typescript
// In App.tsx or a test component
import { emailService } from './services/email';

<button onClick={async () => {
  await emailService.testConnection();
}}>
  Test Email Configuration
</button>
```

## Email Templates

### Admin Alert Template

Includes:

- 🚨 Urgent alert banner
- Crime category and location
- Reporter contact email
- Full incident description
- Case reference number
- Dashboard action button
- Professional HTML styling

### Reporter Update Template

Includes:

- Status change notification
- Case reference number
- Original report summary
- Current status badge
- Professional HTML styling

## Production Checklist

- [ ] Choose production SMTP provider (SendGrid recommended)
- [ ] Configure API keys in production environment variables
- [ ] Update `VITE_SMTP_FROM` to official domain email
- [ ] Update `VITE_APP_URL` to production domain
- [ ] Test email sending with real incidents
- [ ] Set up email logging/monitoring
- [ ] Configure email retry policy
- [ ] Add email unsubscribe mechanism (future)
- [ ] Implement email rate limiting (future)

## Future Enhancements

- [ ] Email templates customization per organization
- [ ] SMS alerts as alternative/addition
- [ ] Scheduled digest emails for admins
- [ ] Automatic retry on failed sends
- [ ] Email delivery tracking
- [ ] Custom admin email distribution rules
- [ ] In-app notification history

## Related Files

- `services/email.ts` - Email service implementation
- `services/db.ts` - Database service with email integration
- `.env.local` - Environment configuration
- `types.ts` - Type definitions for Incident, User, etc.
