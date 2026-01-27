# Crime Watch Email Notification Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CRIME WATCH APPLICATION                     │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────┐
                    │   Reporter Login    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Report a Crime     │
                    │   (Form Fills)      │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        │                                             │
        │       INCIDENT CREATION FLOW                │
        │                                             │
        └──────────────────────┬──────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Form Validation    │
                    │  (Client-side)      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ dbService.addIncident()
                    │  (Server/Database)  │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        │                                             │
        │       DATABASE OPERATIONS                   │
        │                                             │
        │  ┌─────────────────────────────────────┐   │
        │  │ INSERT into incidents table:         │   │
        │  │ - title, category, location         │   │
        │  │ - description, reporter_id          │   │
        │  │ - status: PENDING                   │   │
        │  │ - created_at, last_updated_at       │   │
        │  │ - status_history: [Initial entry]   │   │
        │  └────────────┬────────────────────────┘   │
        │               │                             │
        │  ┌────────────▼────────────────────────┐   │
        │  │ SELECT incident from database       │   │
        │  │ (Return full incident data)         │   │
        │  └────────────┬────────────────────────┘   │
        │               │                             │
        │  ✅ INCIDENT CREATED IN SUPABASE            │
        │               │                             │
        └───────────────┼─────────────────────────────┘
                        │
        ┌───────────────▼─────────────────┐
        │  emailService.sendCrimeReportAlert()
        │                                 │
        │  ⚠️ IMPORTANT: Async, non-blocking
        │     Failure doesn't rollback incident
        │                                 │
        └───────────────┬─────────────────┘
                        │
        ┌───────────────▼─────────────────┐
        │ EMAIL PIPELINE                  │
        │                                 │
        │ 1. VALIDATE SMTP Config         │
        │    ✓ Host, Port                 │
        │    ✓ User, Password             │
        │    ✓ Admin emails list          │
        │                                 │
        │ 2. FORMAT EMAIL                 │
        │    ✓ HTML template rendering    │
        │    ✓ Crime details insertion    │
        │    ✓ Dashboard link generation  │
        │                                 │
        │ 3. CREATE TRANSPORTER           │
        │    ✓ Nodemailer connection      │
        │    ✓ SMTP authentication        │
        │                                 │
        │ 4. SEND EMAIL                   │
        │    ✓ To: All VITE_ADMIN_EMAILS  │
        │    ✓ From: VITE_SMTP_FROM       │
        │    ✓ Subject: 🚨 New Crime Alert
        │    ✓ Body: HTML formatted       │
        │                                 │
        │ 5. HANDLE RESULT                │
        │    ✅ If sent: Log messageId    │
        │    ❌ If failed: Log error      │
        │                                 │
        └───────────────┬─────────────────┘
                        │
        ┌───────────────▼──────────────────────┐
        │      EMAIL DELIVERY                  │
        │                                      │
        │   Via SMTP Server:                   │
        │   ┌────────────────────────────────┐ │
        │   │ VITE_SMTP_HOST                 │ │
        │   │ (gmail, sendgrid, mailtrap,..  │ │
        │   └────────────────────────────────┘ │
        │                                      │
        │   ┌────────────────────────────────┐ │
        │   │ 📧 Delivered to Admin Email    │ │
        │   │ admin@mail.com                 │ │
        │   │ admin2@mail.com                │ │
        │   │ ...                            │ │
        │   └────────────────────────────────┘ │
        │                                      │
        └──────────────────────────────────────┘
                        │
        ┌───────────────▼──────────────────────┐
        │     USER RECEIVES EMAIL              │
        │                                      │
        │  Subject: 🚨 URGENT: New Crime...   │
        │                                      │
        │  Content:                            │
        │  ├─ Crime title & category          │
        │  ├─ Location details                 │
        │  ├─ Reporter email                   │
        │  ├─ Full description                 │
        │  ├─ Case reference number            │
        │  └─ Dashboard action link            │
        │                                      │
        └──────────────────────────────────────┘


=============================================================
STATUS UPDATE FLOW (When Admin Changes Incident Status)
=============================================================

                    ┌─────────────────────┐
                    │   Admin Dashboard   │
                    │  (Views incident)   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Status Change Menu  │
                    │ (PENDING → ASSIGNED)│
                    └──────────┬──────────┘
                               │
            ┌──────────────────┴──────────────────┐
            │                                     │
            │    UPDATE INCIDENT STATUS            │
            │    dbService.updateIncidentStatus()
            │                                     │
            └──────────────────┬──────────────────┘
                               │
            ┌──────────────────▼──────────────────┐
            │  DATABASE OPERATIONS                │
            │                                     │
            │  1. GET current incident            │
            │     - Fetch status, history         │
            │                                     │
            │  2. CHECK status changed            │
            │     - Only proceed if different     │
            │                                     │
            │  3. UPDATE incident                 │
            │     - New status                    │
            │     - last_updated_at timestamp     │
            │     - Append to status_history      │
            │                                     │
            │  4. COMMIT to Supabase              │
            │                                     │
            │  ✅ STATUS UPDATED                  │
            │                                     │
            └──────────────────┬──────────────────┘
                               │
            ┌──────────────────▼──────────────────┐
            │  emailService.sendStatusUpdateEmail()
            │                                     │
            │  ONLY sends if:                     │
            │  - Status actually changed          │
            │  - incident.reporter_email exists   │
            │  - SMTP configured                  │
            │                                     │
            └──────────────────┬──────────────────┘
                               │
            ┌──────────────────▼──────────────────┐
            │  REPORTER RECEIVES STATUS EMAIL     │
            │                                     │
            │  Subject: 📋 Status Update...       │
            │                                     │
            │  Content:                           │
            │  ├─ Case reference                  │
            │  ├─ Original report summary         │
            │  ├─ New status (color badge)        │
            │  └─ Investigation progress message  │
            │                                     │
            └──────────────────────────────────────┘


=============================================================
COMPONENT INTERACTION DIAGRAM
=============================================================

┌────────────────────────────────────────────────────────┐
│                    App.tsx                             │
│              (Root Component)                          │
└────────────────────┬─────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼─────────┐      ┌─────▼────────┐
    │   Dashboard  │      │  IncidentForm│
    │  (Main UI)   │      │ (Report Form)│
    │              │      │              │
    │ • View list  │      │ • Fill inputs│
    │ • Change     │      │ • Validate   │
    │   status     │      │ • Submit     │
    │ • Delete     │      │              │
    └────┬─────────┘      └─────┬────────┘
         │                      │
         │      ┌───────────────┘
         │      │
         └──────┴───────────────────────┐
                                        │
                    ┌───────────────────▼──────┐
                    │   dbService (db.ts)      │
                    │                          │
                    │ • addIncident()          │
                    │ • updateIncidentStatus() │
                    │ • deleteIncident()       │
                    │ • subscribeToIncidents() │
                    │                          │
                    └───────────┬──────────────┘
                                │
                    ┌───────────▼──────────┐
                    │ Supabase Client      │
                    │                      │
                    │ • INSERT/UPDATE      │
                    │ • Database ops       │
                    │ • Real-time sync     │
                    │                      │
                    └───────────┬──────────┘
                                │
                    ┌───────────▼──────────┐
                    │ PostgreSQL (Supabase)
                    │                      │
                    │ • incidents table    │
                    │ • users table        │
                    │ • Stored data        │
                    │                      │
                    └──────────────────────┘

                        │
                        │ NEW EMAIL FLOW
                        │
         ┌──────────────▼────────────────┐
         │  emailService (email.ts)      │
         │                               │
         │ • sendCrimeReportAlert()      │
         │   ├─ Validate config          │
         │   ├─ Format HTML template     │
         │   ├─ Create transporter       │
         │   └─ Send via SMTP            │
         │                               │
         │ • sendStatusUpdateEmail()     │
         │   ├─ Check conditions         │
         │   ├─ Format template          │
         │   └─ Send to reporter         │
         │                               │
         │ • testConnection()            │
         │   └─ Verify SMTP config       │
         │                               │
         └──────────────┬────────────────┘
                        │
              ┌─────────▼────────────┐
              │  Nodemailer (SMTP)  │
              │                      │
              │ Transport Creation   │
              │ Email Delivery       │
              │                      │
              └─────────┬────────────┘
                        │
              ┌─────────▼────────────┐
              │  SMTP Server         │
              │                      │
              │ • Gmail              │
              │ • SendGrid           │
              │ • Outlook            │
              │ • AWS SES            │
              │ • Custom             │
              │                      │
              └─────────┬────────────┘
                        │
              ┌─────────▼────────────┐
              │  📧 Email Sent       │
              │                      │
              │  Admin Inbox         │
              │  Reporter Inbox      │
              │                      │
              └──────────────────────┘


=============================================================
ENVIRONMENT CONFIGURATION FLOW
=============================================================

.env.local (Credentials)
    │
    ├─ VITE_SUPABASE_URL → supabase.ts
    ├─ VITE_SUPABASE_ANON_KEY → supabase.ts
    │
    └─ Email Configuration → email.ts
       ├─ VITE_SMTP_HOST
       ├─ VITE_SMTP_PORT
       ├─ VITE_SMTP_USER
       ├─ VITE_SMTP_PASSWORD
       ├─ VITE_SMTP_FROM
       ├─ VITE_ADMIN_EMAILS (comma-separated)
       └─ VITE_APP_URL


=============================================================
DATA FLOW: Crime Report to Admin Email
=============================================================

User Input (Frontend)
├─ title: "Car Theft"
├─ category: "Auto Theft"
├─ location: "Downtown Parking"
├─ description: "Silver Honda stolen..."
├─ reporter_id: "user-123"
└─ reporter_email: "user@example.com"

         │
         ▼

Incident Object (Typed)
├─ id: "incident-uuid"
├─ title: "Car Theft"
├─ category: "Auto Theft"
├─ location: "Downtown Parking"
├─ description: "Silver Honda stolen..."
├─ reporter_id: "user-123"
├─ reporter_email: "user@example.com"
├─ status: "PENDING"
├─ created_at: "2024-01-15T10:30:00Z"
├─ last_updated_at: "2024-01-15T10:30:00Z"
└─ status_history: [
    { status: "PENDING", changed_at: "...", note: "..." }
  ]

         │
         ▼

Supabase INSERT
└─ Incident stored in PostgreSQL

         │
         ▼

Email Template Generation
├─ Parse environment config
├─ Get admin emails
├─ Render HTML template with:
│  ├─ title
│  ├─ category
│  ├─ location
│  ├─ description
│  ├─ reporter_email
│  ├─ created_at
│  ├─ Case reference (id first 8 chars)
│  └─ Dashboard button link
└─ Template styling applied

         │
         ▼

SMTP Configuration
├─ Host: smtp.gmail.com
├─ Port: 587
├─ Auth: user@gmail.com + app-password
└─ From: noreply@crimewatch.app

         │
         ▼

Nodemailer Transporter
├─ Create connection to SMTP
├─ Authenticate with credentials
└─ Ready to send

         │
         ▼

Email Send
├─ To: [admin@mail.com, admin2@mail.com]
├─ From: noreply@crimewatch.app
├─ Subject: 🚨 URGENT: New Crime Report - Car Theft
└─ Body: HTML (formatted template)

         │
         ▼

SMTP Server Processing
├─ Validates credentials
├─ Accepts email for delivery
└─ Returns Message ID

         │
         ▼

Email Delivery
├─ Routes to recipient mail server
├─ Delivers to inbox
└─ ✅ Admin notified in real-time
```

## Error Handling Strategy

```
Try Block (Email Attempt)
    │
    ├─ SMTP Not Configured
    │  └─ ⚠️ Warn in console, skip email
    │
    ├─ Invalid Credentials
    │  └─ ❌ Error logged, incident created anyway
    │
    ├─ Network Timeout
    │  └─ ❌ Error logged, incident created anyway
    │
    ├─ Invalid Email Format
    │  └─ ❌ Error logged, incident created anyway
    │
    └─ ✅ Success
       └─ Log messageId, incident created
```

## Real-time Updates (Supabase Channels)

```
Dashboard Component
    │
    ├─ Subscribes to incidents channel
    │
    └─ Listens for 'postgres_changes' events
       │
       ├─ INSERT: New incident created
       │  └─ refetch getIncidents() → update UI
       │
       ├─ UPDATE: Status or details changed
       │  └─ refetch getIncidents() → update UI
       │
       └─ DELETE: Incident removed
          └─ refetch getIncidents() → update UI

Result: Dashboard updates in real-time
when any admin changes anything
```

---

**Key Points:**

- ✅ Email sends **asynchronously** (doesn't block incident creation)
- ✅ Email failure **doesn't rollback** incident (graceful degradation)
- ✅ **Multiple admins** can receive notifications
- ✅ **Two email types**: Crime alerts (to admins) + Status updates (to reporter)
- ✅ **Professional templates** with HTML formatting and styling
- ✅ **Real-time sync** keeps dashboard updated
- ✅ **Multiple SMTP providers** supported (Gmail, SendGrid, etc.)
