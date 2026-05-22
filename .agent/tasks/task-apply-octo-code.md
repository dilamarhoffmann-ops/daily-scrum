# Task: Apply Octo Code Visual Model

## Overview
Transform the application's visual identity to the "Octo Code" design system, a developer-centric, dark-mode-first aesthetic inspired by platform design systems like GitHub's Primer.

## Deep Design Thinking (Mandatory)

### 1. The Modern Cliché Scan (Anti-Safe Harbor)
- **Am I defaulting to 'Left Text / Right Visual'?** -> We will use a structured, dense grid layout typical of developer tools, not marketing landing pages.
- **Am I using Bento Grids safely?** -> No, we will use flat, border-separated lists and cards as per the spec.
- **Am I using standard SaaS fonts?** -> No, we are using Inter and JetBrains Mono as requested.

### 2. Topological Hypothesis
- **Path**: **TYPOGRAPHIC BRUTALISM / DENSE INFORMATION**.
- Text and code are the primary visual weights.
- Depth comes from background color layering (#0D1117 > #161B22 > #1C2128) rather than shadows.

### 3. Design Commitment
```markdown
🎨 DESIGN COMMITMENT: OCTO CODE (LAYERED FLAT)

- **Topological Choice**: Flat layering with background shifts instead of shadows. Dense list and grid views.
- **Risk Factor**: Might feel too dense or "dry" for non-developer users if not balanced with clean typography.
- **Readability Conflict**: High density challenges the eye; precise typography (JetBrains Mono for code) is critical.
- **Cliché Liquidation**: Killed soft gradients, glassmorphism, and large rounded corners (>6px).
```

## Task Breakdown

### Phase 1: Global Styles & Tokens (index.css)
- [x] Add Inter and JetBrains Mono fonts via Google Fonts.
- [x] Update `@theme` with Octo Code colors:
    - Background: `#0D1117`
    - Surface: `#161B22`
    - Primary: `#2F81F7`
    - Success: `#238636` (Growth Green) or `#3FB950`
    - Border: `#30363D`
- [x] Set border-radius defaults to 6px (max).
- [x] Remove old Zen/Pastel tokens and classes if they conflict.

### Phase 2: Component Migration
- [ ] Update buttons to use Octo Code specs (6px radius, specific colors).
- [ ] Update cards to use `#161B22` background and `#30363D` border.
- [ ] Update inputs to use `#0D1117` background and specific focus states.
- [ ] Update chips/tags to use pills with low opacity backgrounds.

### Phase 3: Verification & Polish
- [ ] Run linting and TypeScript checks.
- [ ] Verify accessibility and contrast.
- [ ] Add micro-animations (max 150ms) as per spec.

## Do's and Don'ts
- Do use dark palette as default.
- Do use JetBrains Mono for code.
- Don't use rounded corners > 6px on functional UI.
- Don't use shadows for elevation.
