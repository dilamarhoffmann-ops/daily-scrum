# Task Implementation Plan: AgileSphere Scrum Lifecycle

This plan outlines the restructuring of the AgileSphere Engine to strictly follow the 6-phase Scrum lifecycle as defined in the provided methodology image.

## 📋 Objectives
- [ ] Implement a 6-stage navigation system.
- [ ] Align UI colors with the methodology schematic.
- [ ] Create specialized modules for **Daily Meeting**, **Sprint Review**, and **Sprint Retrospective**.
- [ ] Update **Sprint Planning** and **Product Backlog** with methodology-specific fields (Meta, PO-only controls).

---

## 🎨 Phase 1: Design System & Navigation (UI/UX)
**Goal:** Align the interface with the visual flow provided in the image.

### 1.1 Update `index.css` Colors
We will add the specific methodology palette to the theme.
- `--color-phase-po`: `#d18d8e` (Product Backlog)
- `--color-phase-st-plan`: `#8b5e52` (Sprint Planning)
- `--color-phase-dev-backlog`: `#e38d41` (Sprint Backlog)
- `--color-phase-dev-daily`: `#9b6912` (Daily Meeting)
- `--color-phase-st-review`: `#4b7482` (Sprint Review)
- `--color-phase-st-retro`: `#0047a2` (Sprint Retrospective)

### 1.2 Update `App.jsx` Navigation
Expand the sidebar to include all 6 stages with their respective icons and colors.

---

## 🏗️ Phase 2: Component Refactoring & Creation
**Goal:** Build the missing blocks of the lifecycle.

### 2.1 Refactor `SprintPlanning.jsx`
- Add a "Sprint Goal" (Meta da Sprint) persistent field.
- Integration: Linking stories to a specific Sprint ID.

### 2.2 Create `DailyMeeting.jsx`
- **Features:**
    - Sprint Timer (Daily duration).
    - "Blocker" manager: Quick check for items marked as `is_blocked`.
    - Mini-Kanban for status updates.
    - Role focus: "Dev" centered view.

### 2.3 Create `SprintReview.jsx`
- **Features:**
    - "Done" stories demo list.
    - Stakeholder feedback input.
    - Increment Acceptance toggle.

### 2.4 Create `SprintRetrospective.jsx`
- **Features:**
    - Interactive columns: "Keep", "Stop", "Start".
    - Action Item creation (converts to items in next Backlog).

---

## 💾 Phase 3: Data Store (Zustand)
**Goal:** Support the persistent data for all phases.

### 3.1 Update `useAgileStore.js`
- [ ] Add `sprint_goal` to the current sprint object.
- [ ] Add `retro_items` array (title, type, votes).
- [ ] Add `review_notes` string for the sprint summary.

---

## 🚀 Verification Plan
1. [ ] Check navigation flow: All 6 tabs functional.
2. [ ] Validate colors: Headers match the image colors for each stage.
3. [ ] Test logic: Can I create a "Retro Item" and see it in the list?
4. [ ] Production Readiness: Run `npm run build` to ensure no regressions.
