# DIGITEE WORLD — AI Powered Sales Intelligence & Management CRM

A production-ready enterprise SaaS CRM built specifically for **DIGITEE WORLD**. It manages market visits, client meetings, automated overdue follow-up alerts, sales pipelines, live team leaderboards, AI daily sales reports, and natural language AI querying.

---

## 🚀 Key Features

1. **Role-Based Access Control (RBAC):**
   - **Super Admin (`admin@digiteeworld.com` / `Password@123`):** Full company visibility, executive dashboard, missed follow-up control center, leaderboard scoring configuration, target assignments, employee management.
   - **Sales Manager (`manager@digiteeworld.com` / `Password@123`):** Team monitoring, activity reviews, lead distribution.
   - **Sales Executive (`rahul@digiteeworld.com` / `Password@123`):** Personal dashboard, morning action briefings ("Who to call today?", "Who to visit today?", "Missed follow-up red alert"), calendar, client records.

2. **Missed Follow-Up Alert System (Critical Automation Engine):**
   - Continuous overdue monitoring calculated from scheduled date & time + admin-configured grace period.
   - Automatically flags overdue status, calculates exact delay (e.g. `5 Hours Overdue`), shows red alert on executive dashboard and alerts Super Admin.
   - Dedicated **Missed Follow-up Control Center** with immediate actions: *View Client*, *Call Client*, *Mark Completed*, *Reschedule*, and *Add Remarks* without deleting history.
   - Employee repeated missed follow-up warning cards for executive oversight.

3. **Live Sales Team Leaderboard:**
   - Visual podium for top 3 reps with **Gold Trophy**, **Silver Trophy**, and **Bronze Trophy**.
   - Daily, Weekly, Monthly, and All-Time ranking modes.
   - Configurable scoring weights: Meeting (+10), Interested (+15), Final Discussion (+20), Deal Finalized (+50), Overdue Follow-up Penalty (-5 pts).

4. **AI Daily Sales Report Generator:**
   - Daily Team Summary, Employee-wise Performance, Important Clients, Management Insights, and Tomorrow's Action Plan.
   - 1-click **Download PDF** (via jsPDF) and **Export to Excel** (via XLSX).
   - Day-over-day and week-over-week revenue and meeting comparisons.

5. **Smart AI Sales Assistant:**
   - Natural language queries answered strictly from real database records (e.g., *"Which employee missed the most follow-ups this week?"*, *"Who is today's top performer?"*, *"Which clients are ready to finalize?"*).
   - Structured answers with data cards and follow-up chips.

6. **Voice-to-CRM Intelligence:**
   - Speech-to-text recording supporting **Hindi, English, and Hinglish** with preview and user confirmation before persisting into CRM.

7. **Interactive 2026–2027 Calendar & Pipeline Kanban:**
   - Monthly, weekly, and daily color-coded views of meetings, calls, follow-ups, and final discussions.
   - Visual drag-and-drop sales pipeline stages.

---

## 🛠️ Quick Start

### 1. Environment Configuration
The `.env` file is pre-configured:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="digitee-world-super-secret-production-key-2026"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
TZ="Asia/Kolkata"
PORT=3000
NODE_ENV="development"
```

### 2. Seed Database
```bash
node scripts/seed.mjs
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 👥 Demo Logins (1-Click Switcher Available in UI)
- **Super Admin:** `admin@digiteeworld.com` / `Password@123`
- **Sales Manager:** `manager@digiteeworld.com` / `Password@123`
- **Sales Executive (Field):** `rahul@digiteeworld.com` / `Password@123`
- **Sales Executive (Digital):** `priya@digiteeworld.com` / `Password@123`

