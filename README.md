# NEU Library Visitor Log System

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat&logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?style=flat&logo=firebase&logoColor=black)
![Deployed](https://img.shields.io/badge/Deployed-Firebase%20Hosting-FF6F00?style=flat&logo=firebase&logoColor=white)
![License](https://img.shields.io/badge/License-Academic-blue?style=flat)

A web-based visitor logging and management system for the **New Era University (NEU) Library**. The application allows library visitors to check in digitally using their Google account, and provides administrators with a real-time analytics dashboard to monitor library usage and manage user accounts.

---

## Live Demo

**[https://libraryproj-softeng.web.app](https://libraryproj-softeng.web.app)**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 + Vite 7 |
| Routing | React Router DOM v7 |
| Authentication | Firebase Authentication (Google OAuth) |
| Database | Cloud Firestore |
| Hosting | Firebase Hosting |
| Styling | Plain CSS (component-scoped) |

---

## Features

### Sprint 1 — Authentication & Onboarding
- Google Sign-In via Firebase Authentication (OAuth 2.0)
- First-time visitor onboarding: select user type (Student, Faculty, Employee) and college/office department
- Persistent auth state — users stay logged in across sessions
- Route protection via `PrivateRoute` component

### Sprint 2 — Check-In System
- One-click library check-in with purpose-of-visit selection
- Six visit reasons: Reading, Research, Use of Computer, Studying, Borrowing/Returning Books, Other
- Each check-in is timestamped and written to Firestore in real time
- Post check-in confirmation/welcome screen

### Sprint 3 — User Dashboard
- Personal stats: visits this month, total visits, current day-streak, top visit reason
- Full personal visit history with color-coded timeline
- Borrowed books tracker with due dates and overdue status indicators
- In-app library catalog with borrow/return functionality
- Library announcements and tips sidebar

### Sprint 4 — Admin Dashboard
- Time-filtered visitor analytics: Today, Weekly, Monthly, Custom date range
- Visitor count with breakdown by College/Office (top 7 shown)
- Visit reason breakdown with relative bar chart
- User search by name or email
- Per-user profile view: type, department, total visits, status
- Block/Unblock user accounts in one click
- Full per-user visit history table

---

## How to Run Locally

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A Firebase project with Authentication (Google provider) and Firestore enabled

### Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/EranJosh/NEU-Library-Project.git
   cd NEU-Library-Project
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy the example file and fill in your Firebase project credentials:

   ```bash
   cp .env.example .env
   ```

   Open `.env` and replace the placeholder values with your actual Firebase config (found in Firebase Console → Project Settings → Your Apps):

   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`.

---

## How to Deploy

This project is deployed to Firebase Hosting.

1. **Install the Firebase CLI** (if not already installed)

   ```bash
   npm install -g firebase-tools
   ```

2. **Log in to Firebase**

   ```bash
   firebase login
   ```

3. **Build the production bundle**

   ```bash
   npm run build
   ```

4. **Deploy to Firebase Hosting**

   ```bash
   firebase deploy --only hosting
   ```

> **Note:** Environment variables prefixed with `VITE_` are embedded into the build bundle at build time. Make sure your `.env` file is present and correct before running `npm run build`.

---

## Firestore Data Model

### Collection: `users`

Stores one document per registered user. The document ID is the Firebase Auth UID.

| Field | Type | Description |
|---|---|---|
| `email` | `string` | User's Google account email |
| `fullName` | `string` | Display name from Google account |
| `userType` | `string` | `"student"`, `"faculty"`, or `"employee"` |
| `college_office` | `string` | Selected college or office department |
| `role` | `string` | `"admin"` for administrators, absent for regular users |
| `isBlocked` | `boolean` | `true` if the admin has restricted this account |
| `isSetupComplete` | `boolean` | `true` after the onboarding form is submitted |
| `createdAt` | `Timestamp` | Account creation timestamp |
| `borrowedBooks` | `Array` | Array of book borrow records (see below) |

**`borrowedBooks` array item structure:**

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Catalog book ID (e.g., `"book-1"`) |
| `status` | `string` | `"borrowed"`, `"overdue"`, or `"returned"` |
| `dateBorrowed` | `Timestamp` | When the book was borrowed |
| `dueDate` | `Timestamp` | Return deadline (14 days from borrow date) |
| `returnedAt` | `Timestamp \| null` | When the book was returned, or `null` if still out |

### Collection: `logs`

Stores one document per library check-in event.

| Field | Type | Description |
|---|---|---|
| `uid` | `string` | Firebase Auth UID of the visitor |
| `userEmail` | `string` | Email of the visitor |
| `college_office` | `string` | Visitor's department at time of check-in |
| `reason` | `string` | Selected purpose of visit |
| `timestamp` | `Timestamp` | Server-side timestamp of the check-in |

---

## Screenshots

> _Screenshots to be added._

| Page | Description |
|---|---|
| Login | Google Sign-In landing page |
| Onboarding | First-time profile setup form |
| Check-In | Purpose-of-visit selection screen |
| Welcome | Post check-in confirmation screen |
| User Dashboard | Personal stats, visit history, and borrowed books |
| Admin Dashboard | Visitor analytics and user management |

---

## Project Structure

```
neu-library-log/
├── public/                   # Static assets (logos, favicon)
├── src/
│   ├── components/
│   │   └── PrivateRoute.jsx  # Route guard for auth and admin access
│   ├── context/
│   │   └── AuthContext.jsx   # Global auth state (Firebase onAuthStateChanged)
│   ├── firebase/
│   │   └── firebaseConfig.js # Firebase app initialization (reads from .env)
│   ├── pages/
│   │   ├── LoginPage.jsx     # Google Sign-In
│   │   ├── OnboardingPage.jsx
│   │   ├── CheckInPage.jsx
│   │   ├── WelcomePage.jsx
│   │   ├── DashboardPage.jsx
│   │   └── AdminDashboard.jsx
│   ├── App.jsx               # Root router and route definitions
│   └── main.jsx              # React entry point
├── .env                      # Local environment variables (gitignored)
├── .env.example              # Environment variable template
├── firebase.json             # Firebase Hosting configuration
└── vite.config.js            # Vite build configuration
```

---

## Documentation

For a deeper technical reference, see [docs/TECHNICAL_DOCUMENTATION.md](docs/TECHNICAL_DOCUMENTATION.md).

---

## Author

**Eran Josh C. Reyes**
New Era University — College of Informatics and Computing Studies
Software Engineering Project — Academic Year 2025–2026
