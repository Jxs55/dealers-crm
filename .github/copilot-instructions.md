# Copilot Instructions – Dealers CRM

This document defines the coding standards, architecture rules, and development guidelines for this project. GitHub Copilot should strictly follow these instructions when generating or modifying code.

The goal is to maintain a clean, scalable, and consistent codebase.

---

# Project Overview

This project is a lightweight CRM used to manage car dealers that will be contacted via WhatsApp.

Tech stack:

* Next.js 14 (App Router)
* TypeScript
* TailwindCSS
* shadcn/ui
* Prisma ORM
* PostgreSQL
* Railway deployment

The application allows users to:

* store dealer information
* track whether a dealer has been contacted
* filter dealers by status
* open WhatsApp Web with a predefined message

---

# Core Principles

Copilot MUST follow these principles when generating code.

### 1. Clean Code

Code must be:

* readable
* simple
* well structured
* properly typed
* consistent with the project structure

Avoid:

* duplicated logic
* overly complex functions
* deeply nested code
* unnecessary abstractions

Functions should do **one thing only**.

---

# Architecture Rules

This project uses **Next.js App Router architecture**.

Directory structure must remain consistent.

src/
app/
components/
lib/
prisma/
types/

Rules:

* `app/` → pages, layouts, server actions
* `components/` → reusable UI components
* `lib/` → utilities (prisma client, helpers)
* `types/` → shared TypeScript types
* `prisma/` → database schema

Copilot must NOT:

* create random folders
* move core files without reason
* mix UI logic with database logic

---

# UI Rules

All UI must use:

* **shadcn/ui components**
* **TailwindCSS**

Never create raw UI if a shadcn component exists.

Use components like:

* Button
* Input
* Table
* Dialog
* Badge
* Select
* Checkbox

UI must always be:

* responsive
* mobile friendly
* accessible

Prefer:

* flex
* grid
* container layouts

Spacing must follow Tailwind conventions.

---

# Component Design

Components must follow these rules:

* reusable
* small
* focused
* typed with TypeScript

Avoid large monolithic components.

Preferred structure:

components/
dealer-table.tsx
dealer-form.tsx
dealer-filters.tsx
whatsapp-button.tsx

---

# Data Layer

Database access must ONLY be done using **Prisma**.

Never use raw SQL unless strictly necessary.

Create a reusable Prisma client:

lib/prisma.ts

Rules:

* All queries must be typed
* Avoid duplicated queries
* Keep database logic separated from UI

---

# Server Actions

Use **Next.js Server Actions** for mutations.

Examples:

* create dealer
* update contact status
* delete dealer

Server actions must:

* validate input
* return typed responses
* handle errors safely

---

# WhatsApp Integration

The app must generate WhatsApp links using this format:

https://wa.me/{PHONE}?text=Hola

Example:

https://wa.me/18095551234?text=Hola

Links must open in a **new tab**.

Phone numbers must be sanitized before generating the link.

---

# State Management

Prefer simple state management:

* React state
* Server actions
* URL filters

Avoid heavy state libraries unless necessary.

---

# Styling Rules

Use TailwindCSS utilities.

Guidelines:

* avoid inline styles
* avoid custom CSS unless required
* keep styling consistent

Design should remain:

* minimal
* modern
* clean

---

# Responsiveness

All UI must work properly on:

* mobile
* tablet
* desktop

Tables should support horizontal scrolling on mobile.

Dialogs and forms must adapt to small screens.

---

# Code Consistency

Copilot must follow:

* consistent naming conventions
* TypeScript typing
* predictable folder structure

Naming examples:

DealerTable
DealerForm
DealerFilters
WhatsappButton

Use camelCase for variables and functions.

Use PascalCase for components.

---

# Performance

Prefer:

* server components where possible
* minimal client components
* optimized queries

Avoid unnecessary re-renders.

---

# Error Handling

Every async operation must:

* handle errors
* return meaningful messages
* avoid crashing the UI

---

# Documentation

Important modules should contain short comments explaining:

* what the module does
* why it exists
* how it should be used

Avoid excessive comments.

Focus on **useful documentation only**.

---

# Security

Always:

* validate inputs
* sanitize phone numbers
* avoid exposing sensitive data

Never expose:

* database URLs
* secrets
* environment variables

---

# Copilot Behavior

When generating code, Copilot should:

* respect the existing architecture
* reuse existing components
* avoid creating duplicate utilities
* prefer extending existing code over replacing it

If a feature already exists, Copilot should extend it rather than rebuild it.

---

# Goal

Maintain a codebase that is:

* clean
* scalable
* consistent
* production-ready
