<div align="center">

<img src="public/neu-logo.png" alt="NEU Logo" width="90" />

# NEU Library Visitor Log System

**A digital check-in system built for the New Era University Library**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Firestore](https://img.shields.io/badge/Firestore-NoSQL-FF6F00?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/docs/firestore)
[![Hosted on Firebase](https://img.shields.io/badge/Hosted%20on-Firebase-FF6F00?style=for-the-badge&logo=firebase&logoColor=white)](https://libraryproj-softeng.web.app)

### 🌐 [View Live Demo → libraryproj-softeng.web.app](https://libraryproj-softeng.web.app)

</div>

---

## 📖 About the Project

This started as a sprint-based Software Engineering class project, but I genuinely tried to make it something usable. The NEU Library still uses a paper logbook for visitor sign-ins — this app replaces that with a clean digital alternative where visitors sign in with their NEU Google account, pick their reason for visiting, and get logged in real time to Firestore.

There's also a full admin side: a dashboard that shows visitor stats broken down by college and visit reason, with time filters, and the ability to search any registered user and view their full visit history — or block them if needed.

---

## 🛠️ Tech Stack

| Layer | Technology | Why I used it |
|---|---|---|
| Framework | React 19 + Vite 7 | Fast dev server, component-based UI |
| Routing | React Router DOM v7 | Clean SPA navigation with protected routes |
| Auth | Firebase Authentication | Google OAuth with zero backend needed |
| Database | Cloud Firestore | Real-time NoSQL, scales with the app |
| Hosting | Firebase Hosting | Free, fast, and deploys in one command |
| Styling | Plain CSS (component-scoped) | Kept it simple, no CSS framework overhead |

---

## ✨ Features

### 🔐 Auth & Onboarding
- Google Sign-In — only `@neu.edu.ph` accounts allowed
- First-time visitors complete a quick profile: user type (Student / Faculty / Employee) and their college or office
- Auth state is persistent — no need to sign in again on every visit
- All protected routes redirect unauthenticated users back to login

### 📋 Check-In System
- Pick your reason for visiting from 6 options: Reading, Research, Use of Computer, Studying, Borrowing/Returning Books, or Other
- Check-in is written to Firestore instantly with a server-side timestamp
- Confirmation screen plays after every successful check-in

### 📊 Personal Dashboard
- Stats at a glance: visits this month, total visits, current visit streak, top reason
- Full visit history displayed as a color-coded timeline
- Borrowed books tracker — see due dates, overdue warnings, and return status
- In-app library catalog to borrow books (14-day loan period)
- Library announcements and tips sidebar

### 🛡️ Admin Dashboard
- Live visitor analytics filtered by Today / Weekly / Monthly / Custom date range
- Breakdown of visitors by college/office and visit reason (with bar chart)
- Search any user by name or email and view their full profile + visit history
- One-click Block / Unblock — blocked users see an Access Denied screen on check-in

---

## 📸 Screenshots

### Auth & Onboarding

<table>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/login-page.png" alt="Login Page" />
      <br /><sub><b>Login Page</b> — Google Sign-In with NEU branding</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/onboarding-page.png" alt="Onboarding Page" />
      <br /><sub><b>Onboarding</b> — First-time profile setup (user type + college)</sub>
    </td>
  </tr>
</table>

### Check-In Flow

<table>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/checkin-page.png" alt="Check-In Page" />
      <br /><sub><b>Check-In</b> — Select your purpose of visit</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/welcome-screen.png" alt="Welcome Screen" />
      <br /><sub><b>Welcome Screen</b> — Confirmation after a successful check-in</sub>
    </td>
  </tr>
</table>

### User Dashboard

<table>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/user-dashboard.png" alt="User Dashboard" />
      <br /><sub><b>Dashboard</b> — Personal stats, visit history, and borrowed books</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/user-dashboard-books.png" alt="Borrowed Books" />
      <br /><sub><b>Borrowed Books</b> — Due dates, overdue status, and return tracking</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/user-dashboard-catalog.png" alt="Book Catalog" />
      <br /><sub><b>Library Catalog</b> — Browse and borrow books from the in-app catalog</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/user-dashboard-tips.png" alt="Announcements and Tips" />
      <br /><sub><b>Sidebar</b> — Library announcements and good-habit tips</sub>
    </td>
  </tr>
</table>

### Admin Dashboard

<table>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/admin-dashboard.png" alt="Admin Dashboard" />
      <br /><sub><b>Analytics</b> — Visitor stats with time filter (Today / Weekly / Monthly)</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/admin-user-search.png" alt="Admin User Search" />
      <br /><sub><b>User Search</b> — Find any registered user by name or email</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <img src="docs/screenshots/admin-user-profile.png" alt="Admin User Profile" />
      <br /><sub><b>User Profile</b> — View full visit history and block/unblock controls</sub>
    </td>
    <td align="center" width="50%">
      <img src="docs/screenshots/admin-user-blocked.png" alt="Admin User Blocked" />
      <br /><sub><b>Blocked User</b> — Blocked status shown with unblock option</sub>
    </td>
  </tr>
</table>

---

## 🗄️ Firestore Data Model

### `users` collection
One document per registered user — document ID is the Firebase Auth UID.

| Field | Type | Description |
|---|---|---|
| `email` | `string` | Google account email |
| `fullName` | `string` | Display name from Google |
| `userType` | `string` | `"student"`, `"faculty"`, or `"employee"` |
| `college_office` | `string` | Selected department |
| `role` | `string` | `"admin"` for admins, absent for regular users |
| `isBlocked` | `boolean` | `true` if account is restricted by admin |
| `isSetupComplete` | `boolean` | `true` once onboarding is done |
| `createdAt` | `Timestamp` | Account creation time |
| `borrowedBooks` | `Array` | Borrow records (see below) |

**`borrowedBooks` item:**

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Catalog book ID (e.g. `"book-3"`) |
| `status` | `string` | `"borrowed"`, `"overdue"`, or `"returned"` |
| `dateBorrowed` | `Timestamp` | Borrow date |
| `dueDate` | `Timestamp` | 14 days from borrow date |
| `returnedAt` | `Timestamp \| null` | Return date, or `null` if still out |

### `logs` collection
One document per check-in event.

| Field | Type | Description |
|---|---|---|
| `uid` | `string` | Firebase Auth UID |
| `userEmail` | `string` | Visitor's email |
| `college_office` | `string` | Department at time of check-in |
| `reason` | `string` | Purpose of visit |
| `timestamp` | `Timestamp` | Server-side check-in time |

---

## 🚀 Running Locally

### Prerequisites
- Node.js v18+
- A Firebase project with Google Auth and Firestore enabled

### Steps

**1. Clone the repo**
```bash
git clone https://github.com/EranJosh/NEU-Library-Project.git
cd NEU-Library-Project
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**

Copy the example file and fill in your Firebase credentials:
```bash
cp .env.example .env
```

Your `.env` should look like this (get the values from Firebase Console → Project Settings → Your Apps):
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**4. Start the dev server**
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📦 Deploying

This project uses Firebase Hosting. After making changes:

```bash
# Build the production bundle
npm run build

# Deploy to Firebase
firebase deploy --only hosting
```

> The `.env` file needs to be present before building — Vite embeds the `VITE_` variables into the bundle at build time.

---

## 📁 Project Structure

```
neu-library-log/
├── public/                   # Static assets (NEU logos, favicon)
├── src/
│   ├── components/
│   │   └── PrivateRoute.jsx  # Auth + admin route guard
│   ├── context/
│   │   └── AuthContext.jsx   # Global auth state via React Context
│   ├── firebase/
│   │   └── firebaseConfig.js # Firebase init (reads from .env)
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── OnboardingPage.jsx
│   │   ├── CheckInPage.jsx
│   │   ├── WelcomePage.jsx
│   │   ├── DashboardPage.jsx
│   │   └── AdminDashboard.jsx
│   ├── App.jsx               # Route definitions
│   └── main.jsx              # Entry point
├── docs/
│   ├── screenshots/          # App screenshots
│   └── TECHNICAL_DOCUMENTATION.md
├── .env                      # Local secrets (gitignored)
├── .env.example              # Template for contributors
├── firebase.json             # Hosting config
└── vite.config.js
```

---

## 📚 Documentation

For a deeper dive into the system architecture, all user flows, Firestore security rules, and known limitations, check out the [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md).

---

## 👤 Author

<table>
  <tr>
    <td>
      <strong>Eran Josh C. Reyes</strong><br />
      New Era University<br />
      College of Informatics and Computing Studies<br />
      Software Engineering — Academic Year 2025–2026
    </td>
  </tr>
</table>
