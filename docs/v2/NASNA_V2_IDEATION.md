# 🌿 Nasna 2.0 — Team Ideation Brief

> **How to use this document:** Read through the ideas, share your honest reactions, and answer the questions at the end. There are no right answers — this is about making sure we build the right things before we start writing code.
>
> **Leave your feedback as comments on this PR** — either inline on specific sections or as general comments below.

---

## Table of Contents

1. [What is Nasna?](#1-what-is-nasna)
2. [What We Built Last Time](#2-what-we-built-last-time)
3. [The Core Problem We're Solving](#3-the-core-problem-were-solving)
4. [The 6 Big Ideas for Nasna 2.0](#4-the-6-big-ideas-for-nasna-20)
5. [How It All Connects — The Full User Journey](#5-how-it-all-connects--the-full-user-journey)
6. [Two Types of Displaced People](#6-two-types-of-displaced-people)
7. [Proposed Build Order](#7-proposed-build-order)
8. [Questions for the Team](#8-questions-for-the-team)

---

## 1. What is Nasna?

**Nasna** — meaning *"Together we grow"* — is a platform we built during the Lebanon war to connect displaced families with organizations and people who could help them.

It started as a tool for field workers (agents) to register displaced families in a structured way, and for NGOs to access that data. In this new version, we want to turn it into a **full humanitarian coordination platform** — something that doesn't just collect data, but actively gets help to the people who need it.

### Who uses it

| Role | What they do |
|------|-------------|
| 👨‍👩‍👧 **Displaced Family** | Registers and gets connected to help |
| 📋 **Field Agent** | Registers families in the field on their behalf |
| 🤝 **NGO / Initiative** | Sees matching cases and provides help |
| 🛡️ **Admin** | Coordinates everything and sees the full picture |
| 🏠 **Housing Provider** | *(New)* Lists a spare room or apartment for displaced families |

---

## 2. What We Built Last Time

During the first war, we built a working version of Nasna that let agents register displaced families and let NGOs log in to view the data.

### ✅ What worked
- A clean, easy-to-use form for agents to register families
- Three languages: Arabic, English, and French
- A secure platform where only validated NGOs could access sensitive data
- A system that actually collected real, structured information about real families

### ⚠️ What didn't work
- **The data was there but we couldn't act on it fast enough.** NGOs would log in and see a list of names but there was no clear "here's what to do next."
- A lot of the actual coordination happened over WhatsApp and phone calls *outside* the platform.
- No way to track whether a family was actually helped or not.
- No way to see the whole picture — which areas had the most need, which NGOs were overwhelmed, where coverage was missing.

**The result:** the platform was a good data collection tool, but it hadn't yet become a coordination and dispatch tool. That's the gap we want to close.

---

## 3. The Core Problem We're Solving

> **The platform has two sides that never connect.**

On one side, we have families who need food, shelter, medical help, and more. On the other side, we have NGOs and individuals who want to help. Right now, there is no automatic bridge between them. Someone has to manually figure out who can help whom and communicate that outside the platform.

In Nasna 2.0, we want **the platform itself to be that bridge.** A family registers. The system knows which NGOs cover that area and what they offer. The right NGOs are notified instantly. They claim the case. Help is on the way. And everyone can see what's happening.

---

## 4. The 6 Big Ideas for Nasna 2.0

Here are the six new features we want to build. We're sharing these before we start building to make sure we're all aligned on what matters most.

---

### 01 🔄 The Matching & Dispatch Engine

**The core of everything.**

Right now, when a family is registered, nothing happens automatically. In v2, the moment a new case comes in, the system instantly identifies which NGOs in that area can help with those specific needs — and notifies them. NGOs can "claim" a case with one click.

- Admin sees a live dispatch view: pending cases, who's assigned, what's stuck
- Cases that go 48+ hours without an update are automatically flagged
- NGOs declare their coverage area and what type of aid they provide when they register
- Matching is based on: **location + needs type + NGO capacity**

---

### 02 🏠 Housing Marketplace

**A dedicated section for finding shelter.**

A place where individuals can list a spare room or apartment for displaced families — free, subsidized, or at market rate. Government and institutional shelters (schools, universities) appear here too, with **live capacity tracking**: how many spots are available right now.

- Families, agents, and NGOs can browse by area and connect directly via WhatsApp
- Admin reviews and approves listings before they go public
- When a center hits 90% capacity it turns yellow; at 100% it stops appearing — preventing people from traveling to a full school at 2am
- Two types of listings:
  - **Individual**: citizen with a spare room
  - **Official**: government/NGO-managed displacement center with capacity tracking

---

### 03 💬 WhatsApp Self-Registration

**The most accessible way to register.**

The hardest thing about the current platform: displaced people need an agent to register them. But in a fast-moving crisis, there aren't always agents available.

With this feature, a person can **text our WhatsApp number from any phone** — no app, no account, no internet browser needed. They answer 5 simple questions and are registered in 3 minutes.

- Works on any phone with mobile data
- Default language: Arabic (can switch to EN or FR by typing it)
- After registration: they receive their **case code** via WhatsApp
- They can text their case code at any time to check what's happening: *"Your case has been assigned to Lebanese Red Cross. They will contact you."*
- QR codes posted at displacement centers link directly to the WhatsApp number

---

### 04 📞 Emergency Contacts Directory

**Simple, but potentially the most life-saving page on the platform.**

A clean, always up-to-date directory of who to call in an emergency — by category and by area. No login required.

- Government emergency lines, Red Cross, UNHCR, UNICEF, hospital emergency lines, security forces, blood banks
- Filterable by **governorate** — when you're in Tyre, you want Tyre-specific numbers
- Admin manages and verifies the list during the crisis so it stays accurate
- Available as a QR code to post at centers and share on social media

---

### 05 🗺️ Live Operations Map

**An admin superpower.**

A full-screen map view that shows the entire response at a glance:

- 📍 **Red/yellow/green pins** for every registered family (by urgency), clustered when zoomed out
- 🔵 **NGO coverage zones** overlaid on the map
- 🏫 **Displacement centers** with capacity fill bars (how full each one is)
- 🏠 **Available housing listings**
- Filter by: date, urgency, needs type, assignment status

This turns the admin's job from "scrolling through a table" to "seeing the whole crisis at a glance." It's also what you'd show to government partners or international donors.

---

### 06 📊 Public Impact Dashboard

**Showing the world what Nasna is doing.**

A live public page showing what Nasna has achieved — no login needed:

- Total families registered / helped / pending
- Active NGOs and where they're operating
- Anonymized displacement heatmap
- Breakdown by needs category

This isn't just for show. It builds trust with new NGO partners, attracts donors, and tells the story of the crisis in a way that motivates action. It's also how we eventually report to international organizations like UNHCR.

---

## 5. How It All Connects — The Full User Journey

Here's what a displaced family's experience looks like end-to-end in Nasna 2.0:

```
1. DISPLACED
   A family arrives at Martyrs School in Beirut, now a displacement center.
   A QR code on the wall shows the Nasna WhatsApp number.
          │
          ▼
2. SELF-REGISTER
   They text the number. In Arabic, a bot asks 5 questions:
   name, household size, most urgent need, current area. Done in 3 minutes.
          │
          ▼
3. NGOS NOTIFIED INSTANTLY
   Three NGOs covering Beirut with food + medical capacity receive a notification:
   "New case at Martyrs School. Family of 5. Urgent: food + medical."
          │
          ▼
4. CASE CLAIMED
   Lebanese Red Cross clicks "Claim this case."
   The family receives a WhatsApp: "Your case has been assigned.
   Lebanese Red Cross will contact you."
          │
          ▼
5. HELP DELIVERED
   Red Cross delivers food and medicine.
   They log it in Nasna: type of aid, date, notes.
   Case moves: Pending → Assigned → In Progress → Completed.
          │
          ▼
6. IMPACT TRACKED
   Admin sees one less red pin in Beirut.
   Public dashboard updates: +1 family helped.
   The data is real and traceable.
```

---

## 6. Two Types of Displaced People

We recognize that displaced people are in two very different situations, and the platform needs to handle both:

### 🏫 At a Designated Center
People who have gone to an official shelter — a school, university, or community hall.

- These centers have a **name, address, capacity, and manager** — we track them as a structured list
- When registering: agent (or the person via WhatsApp) selects the center from a dropdown
- Location data is clean and accurate for matching

### 🏡 With Family in a Safe Area
People who fled to a different city and are staying with relatives.

- They have an address but no official center affiliation
- When registering: select **current governorate + area**
- NGOs covering that area can be matched and notified

> **Note for the team:** The admin manages the list of official centers. As new centers open during the crisis, admin adds them — agents and NGOs immediately see them in the dropdown. This is much better than free-text location fields which create messy, unsearchable data.

---

## 7. Proposed Build Order

Each phase is independently deployable. The platform is more valuable with each phase, but functional after Phase 1.

| Phase | What We're Building | Estimated Time |
|-------|---------------------|---------------|
| **Phase 0** 🔴 | Fix 6 critical bugs in the existing platform (security, data integrity, pagination) | 1–2 weeks |
| **Phase 1** 🟠 | Dispatch engine + case status tracking + emergency contacts directory | 3–4 weeks |
| **Phase 2** 🟡 | Housing marketplace — individual listings + displacement centers with capacity | 3–4 weeks |
| **Phase 3** 🔵 | WhatsApp self-registration bot + notifications to displaced families | 3–4 weeks |
| **Phase 4** 🟢 | Public impact dashboard + donation features | 2–3 weeks |
| **Phase 5** 🟣 | Full operations map for admin | 1–2 weeks |

> **For developers:** The full technical spec (data models, Cloud Functions, component structure, Firestore rules, API contracts) is in [`nasna-v2-technical-spec.docx`](./nasna-v2-technical-spec.docx) in this same folder.

---

## 8. Questions for the Team

**Please take 15 minutes to read these and leave your answers as comments on this PR.** There are no wrong answers — the goal is to make sure we build the right things.

---

### On the Core Platform

**Q1.** The matching system will notify NGOs when a case comes in that matches their area and capabilities. Do you think NGOs will actually claim cases themselves, or will the admin still need to assign manually? What might stop NGOs from using the platform this way?

**Q2.** We want to add a case lifecycle — `Pending → Assigned → In Progress → Completed`. Who should be allowed to move a case from one stage to the next? Only the assigned NGO? Agents too? Admin only?

**Q3.** Is there any risk of two NGOs showing up to help the same family? How do we prevent that within the platform?

---

### On the WhatsApp Bot

**Q4.** The self-registration bot asks 5 questions over WhatsApp. What are the 5 most critical things we need to know about a displaced person? *(Name, area, household size, main need... what else?)*

**Q5.** When a displaced person sends a message to the bot, it replies in Arabic by default. Should it detect the language of their first message and respond automatically? Or always start in Arabic?

**Q6.** What should happen if someone tries to register twice from the same phone number — update their existing record, or create a new one?

---

### On the Housing Marketplace

**Q7.** Should anyone be able to list a housing space, or should listers go through a verification process first? What level of trust is needed before a listing appears publicly?

**Q8.** When a displaced family contacts a lister directly via WhatsApp, the platform won't know if a match was made. Does this matter to us, or is connecting them enough?

**Q9.** Some property owners may want to offer housing at market rate during a war — do we allow this, or only free/subsidized listings?

---

### On Priorities

**Q10.** If we could only build **two of the six features** in the next 4 weeks, which two would have the most real-world impact right now?

**Q11.** Is there anything we've described that you think is too complicated, risky, or just not the right direction? What would you simplify or cut?

**Q12.** Is there anything important that's **missing** from this plan? A feature, a user type, a problem we haven't thought about?

---

> *This is a humanitarian project. Every decision we make here has a direct impact on real families. Let's take the time to get it right.*

---

*Nasna Team — March 2026*
