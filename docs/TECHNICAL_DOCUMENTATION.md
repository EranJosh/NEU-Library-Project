# Technical Documentation
## NEU Library Visitor Log System

**Version:** 1.0.0
**Author:** Eran Josh C. Reyes
**Institution:** New Era University — College of Informatics and Computing Studies
**Course:** Software Engineering
**Academic Year:** 2025–2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [System Architecture](#2-system-architecture)
3. [Application Routes](#3-application-routes)
4. [User Flows](#4-user-flows)
   - 4.1 [Login Flow](#41-login-flow)
   - 4.2 [Onboarding Flow](#42-onboarding-flow)
   - 4.3 [Check-In Flow](#43-check-in-flow)
   - 4.4 [User Dashboard Flow](#44-user-dashboard-flow)
   - 4.5 [Admin Dashboard Flow](#45-admin-dashboard-flow)
   - 4.6 [Block / Unblock User Flow](#46-block--unblock-user-flow)
5. [Component Reference](#5-component-reference)
6. [State Management](#6-state-management)
7. [Firestore Security Considerations](#7-firestore-security-considerations)
8. [Environment Variables](#8-environment-variables)
9. [Known Limitations](#9-known-limitations)

---

## 1. System Overview

The NEU Library Visitor Log System is a single-page application (SPA) built with React and Vite, backed entirely by Firebase (Authentication, Firestore, and Hosting). It has two distinct user roles:

| Role | Access |
|---|---|
| **Visitor** (student / faculty / employee) | Login, onboarding, check-in, personal dashboard |
| **Administrator** | All visitor access + admin analytics dashboard and user management |

The system replaces a manual paper-based library logbook with a digital, searchable, and analytics-ready visitor record.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                        │
│                                                             │
│   React 19 + React Router DOM v7                            │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│   │  LoginPage   │  │  CheckIn     │  │  AdminDashboard  │ │
│   │  Onboarding  │  │  Welcome     │  │                  │ │
│   │              │  │  Dashboard   │  │                  │ │
│   └──────────────┘  └──────────────┘  └──────────────────┘ │
│                  ↕ AuthContext (React Context API)           │
└───────────────────────────┬─────────────────────────────────┘
                            │ Firebase SDK (JS v12)
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
  ┌───────────────┐ ┌──────────────┐ ┌──────────────────┐
  │ Firebase Auth │ │  Firestore   │ │ Firebase Hosting │
  │ (Google OAuth)│ │  (NoSQL DB)  │ │  (Static CDN)    │
  └───────────────┘ └──────────────┘ └──────────────────┘
```

### Key Architectural Decisions

| Decision | Rationale |
|---|---|
| **No backend server** | Firebase provides auth, database, and hosting — no Node/Express server needed, reducing infrastructure complexity |
| **React Context for auth state** | `AuthContext` wraps the entire app and exposes `currentUser`, `userProfile`, and `loading` to all pages without prop-drilling |
| **`PrivateRoute` component** | Centralizes auth and role checks in one place; all protected routes wrap their component in `<PrivateRoute>` |
| **`borrowedBooks` stored on user doc** | Avoids a subcollection to keep Firestore security rules simpler; the array is fully owned by the user document |
| **`serverTimestamp()` for check-in** | Ensures timestamps are authoritative (server clock), preventing clock-skew issues on client devices |
| **`VITE_` prefixed env vars** | Vite statically inlines env vars at build time; only variables prefixed `VITE_` are exposed to the browser bundle |

---

## 3. Application Routes

| Path | Component | Access | Description |
|---|---|---|---|
| `/` | `LoginPage` | Public | Google Sign-In entry point |
| `/onboarding` | `OnboardingPage` | Authenticated | First-time profile setup |
| `/checkin` | `CheckInPage` | Authenticated | Select visit reason and submit check-in |
| `/welcome` | `WelcomePage` | Authenticated | Post-check-in confirmation screen |
| `/dashboard` | `DashboardPage` | Authenticated | Personal stats, visit history, borrowed books |
| `/admin` | `AdminDashboard` | Admin only | Visitor analytics and user management |
| `*` | Redirect | — | All unknown paths redirect to `/` |

Route protection is enforced by `PrivateRoute`:

```
Request → PrivateRoute
              ├── loading? → show spinner
              ├── no currentUser? → redirect to /
              ├── adminOnly && role !== "admin"? → redirect to /checkin
              └── pass → render children
```

---

## 4. User Flows

### 4.1 Login Flow

```
User visits / (LoginPage)
    │
    ▼
Clicks "Sign in with Google"
    │
    ▼
Firebase Auth opens Google OAuth popup
    │
    ├── Auth fails → error message shown, user stays on LoginPage
    │
    └── Auth succeeds → onAuthStateChanged fires
            │
            ▼
        AuthContext fetches users/{uid} from Firestore
            │
            ├── Document does NOT exist → LoginPage writes new user doc
            │       (email, fullName, createdAt, isSetupComplete: false)
            │       → navigate to /onboarding
            │
            └── Document exists
                    │
                    ├── isSetupComplete: false → navigate to /onboarding
                    ├── role: "admin" → navigate to /admin
                    └── regular user → navigate to /checkin
```

### 4.2 Onboarding Flow

```
User lands on /onboarding (OnboardingPage)
    │
    ▼
Step 1: Select user type (Student / Faculty / Employee)
    │
    ▼
Step 2: Select College or Office from dropdown (19 options)
    │
    ▼
Clicks "Confirm and Proceed"
    │
    ├── Validation fails (missing field) → error message shown
    │
    └── Validation passes
            │
            ▼
        Firestore: updateDoc(users/{uid}, {
            userType, college_office, isSetupComplete: true
        })
            │
            ▼
        refreshProfile() re-fetches user doc into AuthContext
            │
            ▼
        navigate to /checkin
```

### 4.3 Check-In Flow

```
User lands on /checkin (CheckInPage)
    │
    ├── userProfile.isBlocked === true
    │       → render "Access Denied" card (no check-in allowed)
    │
    └── user is active
            │
            ▼
        Display visit reason grid (6 options)
            │
            ▼
        User selects a reason
            │
            ▼
        Clicks "Check-In to Library"
            │
            ├── No reason selected → error: "Please select a reason"
            │
            └── Reason selected
                    │
                    ▼
                Firestore: addDoc(logs, {
                    uid, userEmail, college_office,
                    reason, timestamp: serverTimestamp()
                })
                    │
                    ▼
                navigate to /welcome
```

### 4.4 User Dashboard Flow

```
User navigates to /dashboard (DashboardPage)
    │
    ▼
On mount, two parallel Firestore reads:
    ├── Query logs where uid == currentUser.uid (ordered by timestamp desc)
    └── getDoc(users/{uid}) — reads borrowedBooks array
            │
            ├── borrowedBooks is empty → seed with sample borrow records
            │       (writes seed data back to Firestore)
            │
            └── borrowedBooks exist → use stored data
    │
    ▼
Compute stats from logs:
    - visitsThisMonth (filter by current month)
    - topReason (tally by reason field)
    - visitStreak (count consecutive days from today backwards)
    - totalVisits (logs.length)
    │
    ▼
Render:
    - Hero card (profile info, member since, "New Check-In" button)
    - 4 stat cards
    - Books Borrowed section (with optional "+ Borrow a Book" catalog)
    - Visit History timeline (last 8 entries)
    - Announcements sidebar
    - Library Tips sidebar
```

**Borrow a Book sub-flow:**

```
User clicks "+ Borrow a Book"
    │
    ▼
Library catalog shown (books not currently borrowed)
    │
    ▼
User clicks "Borrow" on a title
    │
    ▼
New record appended to borrowedBooks array:
    { id, status: "borrowed", dateBorrowed: now, dueDate: +14 days, returnedAt: null }
    │
    ▼
Firestore: updateDoc(users/{uid}, { borrowedBooks: updatedArray })
```

### 4.5 Admin Dashboard Flow

```
Admin navigates to /admin (AdminDashboard)
    │
    ▼
On mount:
    ├── Fetch all users (getDocs on "users" collection, sorted by fullName)
    └── Fetch logs for default filter "Today"
    │
    ▼
Render stats for selected time filter (Today / Weekly / Monthly / Custom):
    - Total visitor count
    - Visitors by College/Office (sorted by count)
    - Visit reasons bar chart
    │
    ▼
Admin changes filter → fetchLogs() re-runs with new date range
    │
    ▼
Admin types in search box → filteredUsers computed via useMemo
    (matches against fullName or email, case-insensitive)
    │
    ▼
Admin selects a user from results:
    ├── Firestore query: logs where userEmail == user.email (ordered by timestamp)
    └── Render user profile card + full visit history table
```

### 4.6 Block / Unblock User Flow

```
Admin has a user selected in AdminDashboard
    │
    ▼
Clicks "Block User" or "Unblock User"
    │
    ▼
Firestore: updateDoc(users/{uid}, { isBlocked: !current })
    │
    ▼
Optimistic UI update:
    - selectedUser state updated
    - allUsers array updated (replaces the affected entry)
    │
    ▼
Effect on blocked user (next time they visit /checkin):
    CheckInPage reads userProfile.isBlocked === true
    → renders "Access Denied" card instead of the check-in form
```

---

## 5. Component Reference

| File | Type | Responsibility |
|---|---|---|
| `App.jsx` | Router | Defines all routes; wraps everything in `AuthProvider` |
| `AuthContext.jsx` | Context Provider | Holds `currentUser` (Firebase Auth) and `userProfile` (Firestore doc); exposes `logout()` and `refreshProfile()` |
| `PrivateRoute.jsx` | Route Guard | Redirects unauthenticated users to `/`; redirects non-admins away from `/admin` |
| `LoginPage.jsx` | Page | Google Sign-In; creates user doc in Firestore on first login |
| `OnboardingPage.jsx` | Page | Two-step profile form (user type + college/office); updates Firestore on submit |
| `CheckInPage.jsx` | Page | Visit reason selection; writes to `logs` collection; shows Access Denied for blocked users |
| `WelcomePage.jsx` | Page | Post-check-in confirmation screen |
| `DashboardPage.jsx` | Page | Personal analytics, borrowed books, visit history, announcements |
| `AdminDashboard.jsx` | Page | Visitor analytics with time filters, user search, block/unblock |

---

## 6. State Management

The app uses React's built-in state management — no external library (Redux, Zustand, etc.) is needed at this scale.

| State Location | What It Holds |
|---|---|
| `AuthContext` | `currentUser`, `userProfile`, `loading` — shared across all pages |
| `LoginPage` local state | `error`, `loading` for the sign-in button |
| `OnboardingPage` local state | `selectedType`, `selectedCollege`, `saving`, `error` |
| `CheckInPage` local state | `selectedReason`, `submitting`, `error` |
| `DashboardPage` local state | `logs`, `borrowedRecords`, `loading`, `showCatalog` |
| `AdminDashboard` local state | `logs`, `allUsers`, filter state, `selectedUser`, `selectedUserLogs`, `blocking` |

`useMemo` is used in `DashboardPage` and `AdminDashboard` to avoid recomputing derived data (stats, filtered users, sorted books) on every render.

---

## 7. Firestore Security Considerations

### Current State

The app currently relies on **client-side logic** to enforce access rules (e.g., `PrivateRoute` for admin, checking `isBlocked` in the UI). Firestore security rules are not included in this repository.

### Recommended Firestore Rules

For production hardening, the following rules are recommended:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection
    match /users/{userId} {
      // Any authenticated user can read their own document
      allow read: if request.auth != null && request.auth.uid == userId;

      // Users can update their own document (for onboarding, borrow/return)
      allow update: if request.auth != null && request.auth.uid == userId;

      // Admins can read and update any user document (for block/unblock)
      allow read, update: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";

      // Only Firebase (server-side trigger or admin SDK) can create user docs
      // For client-side creation on first login, allow authenticated users:
      allow create: if request.auth != null && request.auth.uid == userId;
    }

    // Logs collection
    match /logs/{logId} {
      // Users can create their own log entries
      allow create: if request.auth != null
        && request.resource.data.uid == request.auth.uid;

      // Users can read their own logs
      allow read: if request.auth != null
        && resource.data.uid == request.auth.uid;

      // Admins can read all logs
      allow read: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";

      // No one can update or delete log entries (immutable audit trail)
      allow update, delete: if false;
    }
  }
}
```

### API Key Exposure

Firebase API keys for web apps are **not secret** — they identify the Firebase project but do not grant any privileged access. Access control is enforced by Firebase Auth and Firestore security rules, not by the API key itself. However, it is still best practice to:

1. Store the key in an environment variable (already done via `.env`)
2. Restrict the API key in Google Cloud Console to only allow requests from your domain
3. Implement proper Firestore security rules as shown above

---

## 8. Environment Variables

All Firebase configuration values are loaded at build time via Vite's `import.meta.env`. Variables must be prefixed with `VITE_` to be included in the browser bundle.

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firestore project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket URL |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Cloud Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app registration ID |

See `.env.example` at the project root for the required variable names and format.

> **Important:** The `.env` file is listed in `.gitignore` and must never be committed. Any contributor cloning this repository must create their own `.env` from `.env.example`.

---

## 9. Known Limitations

| Limitation | Details |
|---|---|
| **No Firestore security rules deployed** | Access control currently relies on client-side checks. A malicious user with direct Firestore access could read or write arbitrary data. Deploying the recommended rules (see Section 7) would resolve this. |
| **Borrowed books catalog is static** | The library catalog is a hardcoded array in `DashboardPage.jsx`. There is no admin interface to add, remove, or edit catalog entries. |
| **Borrowed books are simulated** | Book borrowing data is seeded with sample records on first load and stored in the user's Firestore document. It is not connected to a real library circulation system. |
| **Admin role must be set manually** | There is no admin registration UI. The `role: "admin"` field must be set directly in the Firestore console for the intended admin user. |
| **No check-out/sign-out logging** | The system logs library entry (check-in) only. There is no mechanism to log when a visitor leaves. |
| **Single Google account per user** | Authentication is exclusively via Google OAuth. Users without a Google account cannot use the system. |
| **No offline support** | The app requires an active internet connection. There is no service worker or offline cache — Firestore calls will fail without connectivity. |
| **No pagination on admin user list** | All users are fetched into memory on admin dashboard load. This will degrade performance with a very large user base (thousands of accounts). |
| **Announcements are hardcoded** | The announcements shown on the user dashboard are static content defined in `DashboardPage.jsx`. There is no admin interface to post or manage announcements dynamically. |
