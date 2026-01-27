# Quick Email Testing Guide

## Fastest Way to Test (Gmail)

### 1. Setup Gmail App Password (5 minutes)

```
1. Go to https://myaccount.google.com/apppasswords
2. Select Mail and Windows (or other device type)
3. Google generates a 16-character password
4. Copy this password
```

### 2. Update .env.local

```env
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-gmail@gmail.com
VITE_SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # The 16-char password from step 1
VITE_SMTP_FROM=your-gmail@gmail.com

VITE_ADMIN_EMAILS=your-gmail@gmail.com,another-admin@gmail.com

VITE_APP_URL=http://localhost:5173
```

### 3. Restart Dev Server

```bash
npm run dev
```

### 4. Test Email in Browser Console

```javascript
// Open DevTools Console (F12) and paste:
import { emailService } from "./services/email.js";

emailService.testConnection().then((result) => {
  console.log(result ? "✅ Email OK" : "❌ Email Failed");
});
```

### 5. Create Test Crime Report

1. Go to http://localhost:5173
2. Login as non-admin (use any email except admin@mail.com)
3. Click "Report a Crime"
4. Fill in form and submit
5. **Check email inbox** - Should receive alert within 1-2 seconds!

## Expected Email Content

**Subject**: 🚨 URGENT: New Crime Report - [Crime Title]

**Body**: Formatted HTML email with:

- Crime title and category
- Location
- Your email address (reporter)
- Full description
- Case reference number
- "View in Dashboard" button

## Troubleshooting

### Email Not Received

**Problem**: Connection timeout

```
Solution: Check port 587 is not blocked
- Try different port: 465 (secure)
- Check ISP not blocking SMTP
```

**Problem**: Gmail says "Invalid credentials"

```
Solution:
- Make sure 2FA enabled on Google account
- Generate NEW app password
- Copy exact password (remove extra spaces)
- Use full email: your-email@gmail.com (not just your-email)
```

**Problem**: See 404 errors for email service

```
Solution:
- Restart npm run dev (webpack needs reload)
- Check services/email.ts was created
- Verify import in services/db.ts
```

## Alternative: Test with Mailtrap (No Real Email Needed)

### Setup Mailtrap

1. Go to https://mailtrap.io
2. Sign up (free tier available)
3. Create new project
4. Go to "SMTP Settings" tab
5. Copy credentials:

```env
VITE_SMTP_HOST=smtp.mailtrap.io
VITE_SMTP_PORT=587
VITE_SMTP_USER=your_user_id
VITE_SMTP_PASSWORD=your_password
VITE_SMTP_FROM=noreply@example.com

VITE_ADMIN_EMAILS=test@example.com
```

### Why Mailtrap?

- ✅ Free email testing inbox
- ✅ No rate limits
- ✅ See all email details in dashboard
- ✅ Perfect for development
- ✅ No need for real email credentials

## Testing Status Update Email

1. Create a crime report (admin receives alert)
2. Login as admin (email: admin@mail.com)
3. View the incident
4. Change status from PENDING to ASSIGNED (or other status)
5. **Check reporter's email inbox** - Should receive status update!

## Debugging

### Enable Console Logging

Email service already logs to console:

- ✅ Success: `Crime report email sent: [messageId]`
- ❌ Error: `Error sending crime report email: [error details]`

Open DevTools console to see these logs.

### Monitor Network

1. Open DevTools (F12)
2. Go to Network tab
3. Create crime report
4. Watch for any failed requests
5. Check email service logs in Console tab

## Production Email Services

Once testing works, upgrade to production service:

| Service            | Free       | Cost          | Setup Time | Recommendation   |
| ------------------ | ---------- | ------------- | ---------- | ---------------- |
| Gmail App Password | ✅         | Free          | 5 min      | Testing only     |
| Mailtrap           | ✅ Partial | $10+/mo       | 5 min      | Dev/staging      |
| SendGrid           | ✅ Limited | $25+/mo       | 15 min     | **Production**   |
| AWS SES            | ✅         | Pay per email | 20 min     | Enterprise       |
| Mailgun            | ✅ Limited | $20+/mo       | 15 min     | Good alternative |

## Next Steps

After confirming email works:

- [ ] Deploy application
- [ ] Set up production SMTP
- [ ] Configure admin email distribution
- [ ] Monitor email delivery
- [ ] Set up email templates (optional)
- [ ] Add email logging/analytics (optional)
