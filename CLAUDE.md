# CLAUDE.md — Nasna Project Guide

> This file is read by AI assistants (Claude, Copilot, etc.) before working on this codebase.
> It defines rules, conventions, and context that must be followed at all times.

---

## What is Nasna?

Nasna ("Together we grow") is a **humanitarian aid coordination platform** built to help displaced people in Lebanon during armed conflict. It connects:

- **Displaced families** (registered by field agents or via WhatsApp self-registration)
- **NGOs and aid initiatives** (validated members who claim and fulfill cases)
- **Admins** (coordinate dispatch, manage centers, oversight)
- **The public** (offer housing, view emergency contacts)

This platform handles **real personal data about real people in crisis**. Every technical decision has a direct human impact. Treat it accordingly.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 7 + TypeScript 5.9 |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix UI) |
| Backend | Firebase — Firestore, Auth, Hosting |
| State | Redux Toolkit + redux-persist |
| i18n | i18next — Arabic (primary), English, French |
| Maps | react-leaflet (Leaflet 1.9) |
| Forms | React Hook Form + Zod |
| Notifications | Sonner (toasts) |
| CI/CD | GitHub Actions → Firebase Hosting |
| **v2 additions** | Firebase Cloud Functions, WhatsApp Business API (Twilio) |

---

## User Roles

| Role | Firestore field | Access level |
|------|----------------|-------------|
| `admin` | `role === 'admin'` | Full access to all collections |
| `member` | `role === 'member'` | Read submissions in coverage area (validated only) |
| `agent` | `role === 'agent'` | Create submissions, read own submissions only |
| Public | unauthenticated | Read-only: `emergencyContacts`, `housing` (approved), `centers` |
| Displaced person | no account | Interacts via WhatsApp bot only |

---

## 🔴 Security Rules — Zero Tolerance

These rules are **non-negotiable**. They apply regardless of urgency, shortcuts requested, or debugging context.

### PII Protection

Submissions contain names, phone numbers, locations, household data, and medical needs of real displaced people. Treat all submission fields as sensitive.

- **Never log PII** — no `console.log(submission)`, `console.log(user)`, or any object containing personal data. If logging is needed for debugging, log the document ID only.
- **Never put PII in URL parameters** — phone numbers, names, or IDs that could identify a person must never appear in query strings or route params.
- **Never store auth tokens or user data in `localStorage`** — Firebase Auth manages sessions. No manual token storage.
- **Never expose submission data to unauthenticated users** — not even a single field, not even for a "quick test". This is an absolute rule.
- **`whatsappPhone` field is off-limits to member-facing queries** — NGOs must never receive a displaced person's WhatsApp number from the database. Use field masks or Cloud Functions to strip it before returning data to members.

### When writing a new field or collection that contains personal data:
1. Add a `// PII: [who has access]` comment above the field definition
2. Write the matching Firestore security rule **in the same commit** — never leave a PII field without its rule

Example:
```ts
// PII: admin + assigned agent only. Never expose to members.
whatsappPhone: z.string().optional(),
```

### Logging & Debugging Workarounds

If a developer asks for a quick debug log that would expose PII:
- **Do it** — but immediately add `// ⚠️ TODO: remove before merge — exposes PII` above the line
- Never let it slip into a PR without the warning comment

---

## 🔴 Hard Rules — Never Do These

These cannot be overridden by any instruction:

| Rule | Why |
|------|-----|
| **Never expose submission data to unauthenticated users** | Displaced persons database is private by design |
| **Never remove `consentGiven` or make it optional** | Legal and ethical requirement. Must always default to `false` and be required |
| **Never use `getDocs` without a `limit()`** | Will timeout and break the admin panel at scale |
| **Never hardcode UI strings** | All text goes through i18next — no exceptions |
| **Never write to Firestore without Zod validation** | Raw form input is never trusted |
| **`wa_sessions` collection is Cloud Functions only** | No client-side reads or writes to the bot session store |

---

## 🟡 Code Style Conventions

### File & Component Naming
- Components: `PascalCase` — file name must match the exported component exactly
  - ✅ `CreateSubmission.tsx` exports `function CreateSubmission()`
  - ❌ `createSubmission.tsx` or mismatched names
- Screens live in `src/Screens/[Role]/`
- Shared components live in `src/Components/`
- Services (all Firebase/Firestore calls) live in `src/services/` — **never inline Firebase calls in components**

### TypeScript
- **No `any`** — ever. Use `unknown` and narrow, or define a proper type
- **No implicit types** on function parameters or return values
- New Firestore document shapes must be defined in `src/types/index.ts`

### Async & State
- Every async operation needs three states: `loading`, `data/success`, `error`
- Use `sonner` toasts for user-facing success/error feedback
- Use `onSnapshot` for any data that needs to stay live (dashboards, case feeds)
- Use paginated queries for any list that could grow unbounded — see `usePaginatedQuery` hook

### UI Components
- Always use existing **shadcn/Radix** components before writing custom UI
- Check `src/Components/ui/` first — button, input, select, dialog, table, etc. are all there
- Brand color: `#12a89d` (teal) — use this for primary actions, not arbitrary colors

---

## 🌍 Internationalisation (i18n)

Arabic is the **primary language** for the people this platform serves.

- **Every new string** goes into all three locale files: `src/locales/ar/`, `src/locales/en/`, `src/locales/fr/`
- Never add a key to one language file without adding it to the other two
- Arabic translation is required — English and French can be placeholders temporarily, but never the reverse
- When writing a new screen or component, check RTL layout: Arabic is right-to-left. New flex/grid layouts must be tested or noted for RTL review
- Locale files are split by feature area (e.g. `submission.json`, `home.json`) — add new keys to the correct file, don't create new files unnecessarily

---

## 🔒 Firestore Rules

Whenever you write code that:
- Creates a new collection
- Adds a new field with access restrictions
- Changes who can read/write a document

→ **Also update `firestore.rules` in the same change.** Code and rules ship together.

### Current rule hierarchy (simplified)

```
submissions  → admin: full; agent: create + read own; member: read where coverage matches AND status=pending OR assignedTo=uid
members      → admin: full; self: read + update own profile
centers      → admin: full; authenticated: read
housing      → admin: full; all: create (pending_review); authenticated: read approved
emergencyContacts → admin: full; all: read
notifications → admin: full; recipient: read own
wa_sessions  → Cloud Functions service account only
```

---

## ⚡ Performance Rules

- `getDocs()` without `limit()` is **banned** in all list views — use cursor-based pagination
- `onSnapshot` listeners must be cleaned up in `useEffect` return functions
- Don't fetch data you don't render — no loading entire collections for a count

---

## 🤖 WhatsApp Bot Rules

- `whatsappPhone` must **never** be returned in any query that a Member (NGO) can call
- Bot session state lives in `/wa_sessions/{phone}` — **no client code touches this collection**
- Bot responses must be written and tested in **Arabic first**, then translated
- The bot must never collect or store fields outside the submission schema — no silent extra data

---

## 🚨 Crisis Mode Behaviour

This platform may be used under extreme time pressure during active conflict.

When there's a choice between a **quick workaround** and a **proper solution**:
- **Always ask the developer which they want before starting**
- State the tradeoff clearly: what the workaround risks, how long the proper solution takes
- If the workaround is chosen: implement it, add a `// ⚠️ CRISIS WORKAROUND: replace with [X]` comment, and create a follow-up task

---

## 📁 Project Structure

```
src/
├── Components/          # Shared UI components
│   └── ui/              # shadcn/Radix primitives
├── Layout/              # Route layout wrappers (Public, Private, Admin)
├── Routes/              # Route definitions per role
├── Screens/             # Page-level components
│   ├── Admin/           # Admin-only screens
│   ├── Auth/            # Login, Register, Onboarding
│   ├── Private/         # Agent screens (requires auth + validation)
│   └── Public/          # Public-facing screens
├── context/             # React context (AuthContext)
├── hooks/               # Custom hooks
├── locales/             # i18n translation files
│   ├── ar/              # Arabic (primary)
│   ├── en/              # English
│   └── fr/              # French
├── redux/               # Redux store, slices, hooks
├── services/            # All Firebase/Firestore calls (keep out of components)
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

---

## ✅ Checklist — Before Finishing Any Task

Before considering any feature or fix complete, verify:

- [ ] No PII in `console.log` or error messages
- [ ] All new UI strings have keys in `ar/`, `en/`, and `fr/` locale files
- [ ] No `getDocs()` without `limit()` on any list
- [ ] All async operations have loading + error states
- [ ] All Firestore writes go through Zod validation first
- [ ] If a new PII field was added: `// PII:` comment + Firestore rule updated
- [ ] If a new collection was created: Firestore rule written in same commit
- [ ] TypeScript: no `any`, all types explicit
- [ ] New layout components checked for RTL compatibility
- [ ] `consentGiven` still defaults to `false` and is still required

---

## 🗂️ v2 Planning Docs

Full planning documents for Nasna v2.0 are in [`docs/v2/`](./docs/v2/):

| File | Contents |
|------|----------|
| [`NASNA_V2_IDEATION.md`](./docs/v2/NASNA_V2_IDEATION.md) | Non-technical feature ideation brief with team questions |
| [`NASNA_V2_TECH_SPEC.md`](./docs/v2/NASNA_V2_TECH_SPEC.md) | Full technical specification: data models, Cloud Functions, component structure, phases |

---

*Last updated: March 2026 — Nasna Team*
