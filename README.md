# ⚡ Kill Pro — Esports Tournament Platform

A full-stack esports tournament platform built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, **Google Sheets** (as database), and **JWT authentication**.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Auth | JWT-based login/register, bcrypt password hashing, role-based access (player, host, admin) |
| 🏆 Tournaments | Create, join, manage PUBG / Free Fire / Custom tournaments |
| 💰 Payments | Host-side QR code payment flow; manual confirmation by host |
| 📸 Screenshots | Players submit result screenshots; host reviews and approves |
| 👑 Winner Selection | Host selects winner; notifications sent automatically |
| 🔔 Notifications | In-app bell + email (Nodemailer) + Discord webhook |
| 📊 Analytics | Chart.js charts for revenue, per-game stats, player count |
| 📥 CSV Export | Admin can export all tournament data as CSV |
| 📱 Responsive | Mobile-first Tailwind CSS UI with clean light gradient design |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│               Next.js 14 (App Router)       │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │  React UI   │  │  API Routes (/api)   │  │
│  │  (Client)   │  │  (Server-side)       │  │
│  └──────┬──────┘  └──────────┬───────────┘  │
│         │                    │              │
│         │    axios/fetch     │              │
│         └────────────────────┘              │
│                    │                        │
│         ┌─────────▼──────────┐              │
│         │  Google Sheets API │              │
│         │  (google-spreadsheet)             │
│         └─────────┬──────────┘              │
│                   │                         │
└───────────────────┼─────────────────────────┘
                    │
         ┌──────────▼──────────┐
         │   Google Sheets     │
         │   (Database)        │
         │                     │
         │  Sheets:            │
         │  • Users            │
         │  • Tournaments      │
         │  • Payments         │
         │  • Notifications    │
         └─────────────────────┘
```

### Data Storage

This project uses **Google Sheets** as its database via the `google-spreadsheet` library. Each sheet acts as a table:

| Sheet | Purpose |
|---|---|
| `Users` | User accounts (username, email, hashed password, role, wallet balance) |
| `Tournaments` | Tournament records (title, game, status, players JSON, host info) |
| `Payments` | Entry fee payments, deposits, withdrawals |
| `Notifications` | In-app notification messages |

### Why Google Sheets?

- Zero infrastructure cost
- Easy to inspect and debug data directly in the spreadsheet
- Suitable for low-to-medium traffic applications
- No database server to manage

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS |
| Database | Google Sheets (via `google-spreadsheet` + `google-auth-library`) |
| Auth | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) |
| Validation | Joi |
| Charts | Chart.js + react-chartjs-2 |
| Notifications | Nodemailer (email) + Discord webhooks |
| Icons | Lucide React |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Google Cloud project with the **Google Sheets API** enabled
- A Google Service Account with access to your spreadsheet

### 1. Clone & Install

```bash
git clone <repo-url>
cd esports-platform
npm install
```

### 2. Environment Variables

Create a `.env.local` file:

```env
# Google Sheets
GOOGLE_SHEET_ID=your_spreadsheet_id
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# JWT
JWT_SECRET=your_jwt_secret_key

# Email Notifications (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password

# Discord Webhook (optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

### 3. Set Up Google Sheets

1. Create a new Google Spreadsheet
2. Add four sheets named exactly: `Users`, `Tournaments`, `Payments`, `Notifications`
3. Add header rows to each sheet:

**Users:** `_id | username | email | password | role | walletBalance | createdAt`

**Tournaments:** `_id | title | description | gameName | entryFee | maxPlayers | prizePool | hostId | hostQRCodeURL | players | winnerId | status | scheduledAt | createdAt`

**Payments:** `_id | playerId | tournamentId | amount | status | type | timestamp`

**Notifications:** `_id | type | userId | tournamentId | message | read | createdAt`

4. Share the spreadsheet with your service account email (Editor access)

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # Login, Register, Me
│   │   ├── tournaments/   # CRUD, Join, Approve, Screenshot
│   │   ├── payments/      # Payments + Admin approve
│   │   ├── analytics/     # Dashboard analytics
│   │   └── notifications/ # Get & mark-read notifications
│   ├── auth/              # Login & Register pages
│   ├── dashboard/
│   │   ├── player/        # Player dashboard
│   │   ├── host/          # Host dashboard (create & manage)
│   │   └── admin/         # Admin dashboard (overview, payments, CSV)
│   ├── tournaments/       # Tournament listing & detail pages
│   └── page.tsx           # Landing page
├── components/
│   ├── AuthProvider.tsx   # JWT auth context
│   ├── effects/           # HeroBackground (CSS gradients)
│   ├── layout/            # Navbar
│   ├── tournaments/       # TournamentCard
│   └── ui/                # NotificationBell
├── lib/
│   ├── db.ts              # Google Sheets connection & helpers
│   ├── googleSheets.ts    # Google auth setup
│   ├── jwt.ts             # JWT sign/verify utilities
│   ├── api.ts             # Response helpers
│   ├── validation.ts      # Joi schemas
│   └── notifications.ts   # Email & Discord webhook
└── types/
    └── index.ts           # TypeScript interfaces
```

---

## 👤 User Roles

| Role | Capabilities |
|---|---|
| **Player** | Join tournaments, submit screenshots, view wallet, deposit/withdraw |
| **Host** | Create tournaments, approve payments, start tournaments, select winners |
| **Admin** | All host capabilities + view all payments, approve financial requests, export data, delete tournaments |

---

## 🔒 Security Notes

- Passwords are hashed with bcrypt (10 rounds)
- JWT tokens are used for API authentication
- Service account credentials should **never** be committed to version control
- Rotate keys immediately if exposed

---

## 📄 License

MIT
