# Crime Watch - Quick Reference Card

## 🚀 5-Minute Setup

```bash
# 1. Create Supabase project at https://supabase.com

# 2. Add to .env.local
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...

# 3. Run SQL from database-setup.sql in Supabase SQL Editor

# 4. Start app
npm run dev

# 5. Test at http://localhost:5173
```

---

## 📊 API Methods

### Database Service

```typescript
// Fetch
const incidents = await dbService.getIncidents();
const userIncidents = await dbService.getUserIncidents(userId);

// Create
const newIncident = await dbService.addIncident({
  title,
  category,
  location,
  description,
  reporter_id,
  reporter_email,
});

// Update
await dbService.updateIncidentStatus(incidentId, status);

// Delete
await dbService.deleteIncident(incidentId);

// Real-time (NEW!)
const unsubscribe = dbService.subscribeToIncidents((incidents) => {
  setIncidents(incidents);
});
unsubscribe(); // Cleanup
```

### Auth Service

```typescript
// Login (creates user if doesn't exist)
const user = await authService.login(email);

// Logout
authService.logout();

// Get current user
const user = authService.getCurrentUser();
```

---

## 🔍 Incident Status

```
PENDING                 → New incident just reported
UNDER_INVESTIGATION    → Admin is working on it
RESOLVED               → Case closed
```

---

## 👥 User Roles

```
REPORTER               → Can file incidents, view their own
ADMIN                  → Can view all, update status, delete
(admin@mail.com = admin)
```

---

## 🗄️ Database Schema

### Users

```
users {
  id: UUID (primary key)
  email: TEXT (unique)
  role: TEXT (REPORTER|ADMIN)
  created_at: TIMESTAMP
  last_login: TIMESTAMP
}
```

### Incidents

```
incidents {
  id: UUID (primary key)
  reporter_id: UUID (foreign key → users.id)
  reporter_email: TEXT
  title: TEXT
  category: TEXT
  location: TEXT
  description: TEXT
  status: TEXT (PENDING|UNDER_INVESTIGATION|RESOLVED)
  status_history: JSONB (array of status changes)
  created_at: TIMESTAMP
  last_updated_at: TIMESTAMP
}
```

---

## ⚙️ Environment Setup

### `.env.local`

```env
# Get these from Supabase Dashboard → Settings → API
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Vercel/Netlify Deployment

Add same vars to your hosting platform's environment settings

---

## 🧪 Test Checklist

- [ ] App loads without errors
- [ ] Can register new user
- [ ] Can login as admin@mail.com / Admin123
- [ ] Can create incident
- [ ] Incident appears in database
- [ ] Can see it in dashboard
- [ ] Open 2 browsers
- [ ] Update status in one
- [ ] See update instantly in other (no refresh!)
- [ ] Page refresh - data persists
- [ ] Can delete incident

---

## 🐛 Common Issues

| Problem                    | Fix                                      |
| -------------------------- | ---------------------------------------- |
| "Cannot find module"       | `npm install`                            |
| No env variables           | Add to `.env.local` and restart          |
| Real-time not working      | Enable Replication in Supabase           |
| 401 errors                 | Check API keys are correct               |
| Empty incident list        | Create incidents or check user_id filter |
| Data disappears on refresh | Database not connected properly          |

---

## 📂 Project Structure

```
crime-watch/
├── components/
│   ├── Dashboard.tsx      (main view, handles real-time)
│   ├── IncidentForm.tsx   (create incident)
│   └── Layout.tsx
├── services/
│   ├── db.ts             (database & auth operations)
│   └── supabase.ts       (Supabase client config)
├── types.ts              (TypeScript interfaces)
├── constants.tsx         (categories, colors, icons)
├── App.tsx               (main component)
├── .env.local            (YOUR API KEYS HERE)
├── SUPABASE_SETUP.md     (detailed setup guide)
├── ARCHITECTURE.md       (technical diagrams)
└── database-setup.sql    (database schema)
```

---

## 🔐 Security Notes

1. **Never commit `.env.local`** to git
2. **API Key is public** but restricted to database tables
3. **RLS Policies** (optional) restrict data access
4. **Timestamps** prevent data manipulation
5. **Status history** provides audit trail

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
# Add env variables in dashboard
```

### Netlify

```bash
npm run build
# Drag build folder to Netlify
# Add env variables in dashboard
```

### Traditional Server

```bash
npm run build
# Deploy dist/ folder to your server
# Set env variables in your hosting environment
```

---

## 💡 Pro Tips

1. **Real-time works best with Postgres**
   - WebSocket connection, not polling
   - ~10-50ms latency

2. **Status History is JSONB**
   - Fully queryable in Supabase
   - Can analyze incident flow patterns

3. **Indexes improve performance**
   - Already created on key columns
   - Scale to thousands of incidents

4. **Multiple admins supported**
   - Register with admin@mail.com
   - Modify RLS to allow multiple admin emails

5. **Audit trail included**
   - status_history tracks all changes
   - who changed and when

---

## 📞 Support

- **Setup issues**: Check SUPABASE_SETUP.md
- **Architecture questions**: Read ARCHITECTURE.md
- **Implementation progress**: See IMPLEMENTATION_CHECKLIST.md
- **Supabase help**: https://supabase.com/docs
- **TypeScript help**: https://www.typescriptlang.org/docs

---

## 🎯 Success = ✨

When you see incidents updating **instantly** across browsers without page refresh, you've succeeded!

That's real-time, persistent Crime Watch ready for production. 🎉

---

**Last Updated**: January 27, 2026
**Status**: ✅ Ready for Deployment
**Estimated Setup Time**: 20-30 minutes
