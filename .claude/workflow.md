# Development Workflow

## Golden Rule

NO CODE GENERATION WITHOUT AN APPROVED PLAN DOCUMENT

## Formatting Rules (CRITICAL)

NEVER use these characters in markdown files as they cause rendering issues:
- NO emoji or Unicode symbols (checkmarks, arrows, boxes, etc.)
- USE plain text alternatives:
  - Instead of checkmark emoji: [x] or "DONE"
  - Instead of arrow emoji: "->" or "to"
  - Instead of box emoji: [ ] for checkboxes
  - Instead of warning emoji: "WARNING:" or "NOTE:"

ALLOWED formatting:
- Standard markdown: # ## ### for headers
- Hyphens for bullets: - item
- Checkboxes: - [ ] and - [x]
- Tables: | column |
- Bold: **text**
- Italic: *text*

## Code Block Rules

When including code blocks or command examples in planning documents:
AVOID triple backtick code blocks in planning documents - they cause rendering issues.
INSTEAD use indented text or descriptive text with inline formatting.

---

## Agent Behavior Process

The agent follows a structured, phase-based approach to feature development, emphasizing planning, implementation, testing, and documentation to mitigate LLM context window limitations. All work is documented in Markdown files for easy resumption across sessions.

### Phase 1: Planning

- **Input**: User provides plain English requirements for a new feature.
- **Output**: Generate a thorough Markdown implementation plan file (e.g., FeatureName.md) in the .project/features/ directory. Include:
  - Executive summary, requirements, architecture overview
  - Phased tasks broken into subphases with dependencies
  - Mobile-first responsive design considerations
  - Accessibility requirements (WCAG 2.1 AA minimum)
  - Integration with existing systems (storage, APIs, service worker)
  - Acceptance criteria for each subphase
  - Context-safe batches for multi-session work
- **Best Practices**: Prioritize web standards and progressive enhancement. Plan for performance (Lighthouse 90+), accessibility, and offline support where applicable.

### Phase 2: Refinement

- Collaborate with user to iterate on the MD plan via chat.
- Update the MD file based on feedback, adding details like browser compatibility, hosting requirements, or mobile-specific considerations.

### Phase 3: Implementation

- **Subphases**: Break into small, testable batches (e.g., data model first, then UI, then integration).
- **Process**:
  - For each subphase: Generate code or full files in responses.
  - User validates locally (browser, mobile device, Lighthouse).
  - Generate notes in a separate MD (e.g., FeatureName_Notes.md) with a checklist.
  - Update checklist as user confirms completion/validation.
- **Resumption for Context Windows**: At session start (or user prompt "let's get started"), review .project folder (notes, features) and feature-specific MDs. Use notes MD to resume.
- **Tests per Subphase**: At each subphase end, specify and run critical tests (manual browser testing, Lighthouse audit, accessibility check).

### Phase 4: Testing and Polish

- After implementation, run full integration/performance tests (Lighthouse, cross-browser, mobile).
- Document bugs/fixes in notes MD.
- Commit to Git with descriptive messages at subphase ends.
- Deploy and verify on live site.

## General Guidelines

- **Memory Mitigation**: All plans, progress, and notes in MD files for stateless resumption. Reference them explicitly in responses.
- **Tasks for Complex Features**: For features with 5+ steps, use task tracking to track execution state.
- **Collaboration**: Always confirm unclear intent with user. Propose alternatives if requirements conflict with web best practices.
- **Version Control**: Use Git branches for features; merge to main and push when complete. Deploy target (GitHub Pages or Firebase) serves from main.

---

## Phase-Based Development Process

### Phase 1: Planning

Goal: Create comprehensive implementation plan before writing any code

Steps:
1. Create .project/features/FeatureName.md with:
   - Executive summary
   - Requirements (plain English from developer)
   - Architecture overview
   - Task breakdown with dependencies
   - Integration points (storage, APIs, service worker, existing UI)
   - Accessibility considerations
   - Acceptance criteria
2. Create .project/features/FeatureName_Notes.md for tracking:
   - Current status
   - Implementation checklist
   - Issues and resolutions
   - Validation progress
3. **Steve reviews plan** (automatic -- checks scope, architecture, acceptance criteria, conflicts)
4. Get developer approval before Phase 2

### Phase 2: Implementation

Goal: Execute the plan with incremental, testable changes

Steps:
1. Reference the approved plan document
2. Implement in small, logical chunks
3. Update FeatureName_Notes.md after each task
4. Mark checklist items complete
5. Document any deviations from plan
6. **Steve reviews every commit** (automatic -- code quality, security, accessibility, rule compliance)

Rules:
- One logical change at a time
- Update notes immediately after changes
- Never skip documentation
- No commit lands without Steve's review

### Phase 3: Validation

Goal: Verify implementation matches requirements

Steps:
1. Test against acceptance criteria
2. Run Lighthouse audit (Performance, Accessibility, Best Practices, PWA)
3. Test on mobile device (touch, orientation, PWA install)
4. Update notes with validation results
5. **Steve reviews branch before merge to master** (automatic -- full diff, regressions, cache list, data safety)
6. Mark feature complete in .project/notes.md
7. Move to "Completed Features" section

---

## Quick Reference Commands

**Keep Me On Track** - Use these phrases to enforce workflow:
- "Stop - we need a plan first" - I'm generating code without a plan
- "Planning phase only" - Only create .md files, no code
- "Phase 2 - implement X" - Begin implementation of planned feature
- "Phase 3 - validate X" - Begin validation of completed feature

**Phase Indicators** - Always specify the phase in your request:
- "Let's plan a new feature" (Phase 1)
- "We're in Phase 2 - build the feature" (Phase 2)
- "This is Phase 1 - create planning docs only" (Phase 1)

---

## Exception: Quick Fixes

The following do NOT require a plan document:
- Single-line bug fixes
- Adding comments or documentation
- Renaming variables for clarity
- Formatting/style corrections
- Updating text or labels
- Bumping cache version in sw.js

Everything else requires the full workflow!

---

## Workflow Checklist Template

Copy this for each new feature:

Phase 1: Planning
- [ ] Create .project/features/FeatureName.md
- [ ] Create .project/features/FeatureName_Notes.md
- [ ] Plan reviewed and approved by developer

Phase 2: Implementation
- [ ] Reference plan document during implementation
- [ ] Update notes after each logical change
- [ ] Mark tasks complete in checklist
- [ ] Document any deviations from plan

Phase 3: Validation
- [ ] Test against acceptance criteria
- [ ] Lighthouse audit passed (90+ all categories)
- [ ] Mobile device testing passed
- [ ] Accessibility testing passed
- [ ] Update notes with validation results
- [ ] Mark feature complete in master notes
- [ ] Deploy to live site and verify

---

## Red Flags (Stop and Reset)

If you see me doing any of these, immediately stop me:
- Generating code without referencing a plan document
- Creating implementation without a feature .md file
- Skipping the notes update after changes
- Moving to next task without marking current task complete
- Implementing features not in the approved plan
- Using emoji or special Unicode characters in markdown files
- Adding placeholder text to input fields
- Using cache-first in a service worker
- Introducing build tools or frameworks to a single-file app without approval
- Silently swallowing errors without user feedback
- Setting inline styles (element.style.*) without clearing them at the start of the render function

Response: Remind me to follow the workflow and return to the appropriate phase.

---

## Cross-Session State Management

**After Phase 1 (Planning) Approval**: When a plan is approved but implementation hasn't started:
1. Create the FeatureName_Notes.md file with empty checklist
2. Add feature to "Active Features" in .project/notes.md
3. If not immediately implementing, add to "Next Up" section

**Session Startup Protocol**: When resuming work ("let's get started"):
1. Read .project/notes.md for Current Focus
2. Scan .project/features/*.md for plans not listed in notes.md
3. If discrepancies found, ask user which feature to prioritize
4. Update notes.md to reflect current session focus

---

## Tips for Success

1. Be Explicit: Always state the phase in your request
2. Reference This Doc: Point to workflow rules when I deviate
3. Use Stop Commands: Don't let me skip ahead
4. Small Steps: Keep implementation chunks small and testable
5. Update Often: Keep notes current - they're our source of truth
6. Plain Text Only: Never use emoji or special Unicode in markdown files
7. Test on Device: Always verify on actual mobile hardware
8. Deploy and Verify: Check the live URL after every push to main

---

## Example Prompts by Agent

**Product Strategy** (Pat):
- "How should we design the inventory entry flow?"
- "What's the best UX pattern for categorizing items?"

**Code Review & Quality Gate** (Steve):
- "Review my staged changes before I commit"
- "Check this approach before I start building"
- "Is this plan ready for approval?"

**Accessibility & QA** (Tony):
- "Audit the app for WCAG 2.1 AA compliance"
- "Check touch target sizes on the item cards"

**Architecture** (Robert):
- "Should I use IndexedDB or localStorage for inventory data?"
- "What's the best pattern for offline-first data sync?"

**Project Management** (Larson):
- "Hey Larson, add a task for implementing search"
- "What should I do next?"
- "What's the project status?"

**Infrastructure** (Nina):
- "Set up GitHub Pages deployment for this repo"
- "The service worker isn't caching correctly"
