# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
University students, using MyOrbit on their phone as a daily check: between classes to see what is urgent, and in the evening to plan and log habits. An admin role also exists (AdminScreen) but students are the primary audience.

## Product Purpose
MyOrbit gives a student one place to run their whole student life: the priority order of university work (tasks and subtasks, agenda, subjects, grades by corte) and the personal habits they must keep up alongside it. Success is the student opening one app each day and knowing what matters now, without juggling separate to-do, calendar, grades and habit apps.

## Positioning
Academic priorities and habits in one app, because for a student they are one life. A generic to-do or calendar app treats university work and personal routines as separate worlds; MyOrbit orders the university workload (including a "radar" of what is urgent) and keeps daily habits beside it.

## Operating Context
Phone-first, often one-handed, in short sessions between classes. Connectivity can be flaky, so the PWA ships an offline shell and offline banner. Quick capture goes through a bottom sheet (QuickAddSheet); navigation through a bottom nav. Screens today: Home, Tasks, Task detail, Agenda, Radar, University, Subject detail, Grades, Habits, Profile, More, Admin, Auth, plus welcome onboarding.

## Capabilities and Constraints
- Tasks with subtasks, agenda, subjects, grades per corte, habits, profile, admin.
- Stack: React 19, Vite, Tailwind 4, vite-plugin-pwa, served via nginx; Java backend (microservices-style, see ARQUITECTURA_Y_PATRONES.md).
- UI language is Spanish only; terminology follows the Colombian university context (e.g. "corte" for grading periods).
- Must work as an offline-capable PWA.
- Mobile-first, one-hand use; desktop is secondary.

## Evidence on Hand
Working app in `frontend/` and `backend/`; planning in `docs/BACKLOG.md` and `ARQUITECTURA_Y_PATRONES.md`. No testimonials, customers or usage metrics exist; do not fabricate them.

## Product Principles
1. One life, one app: academic priorities and habits share the same daily view.
2. What is urgent first: surface the priority order before anything else.
3. Capture in seconds, one-handed.
4. Works offline; never lose the student's input.
5. Spanish, student-native language, no corporate jargon.

## Accessibility & Inclusion
Target WCAG AA: contrast, touch target size and reduced-motion support are required.
