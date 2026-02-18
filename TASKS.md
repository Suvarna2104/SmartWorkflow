# Smart Workflow Management System - Tracking & tasks

## Overview
This file tracks the progress of the system audit, strict workflow implementation, and security hardening.

## Phases

### Phase 1: Audit & Baseline Stabilization
- [ ] Create TASKS.md (This file)
- [ ] Run and record server baseline status
- [ ] Run and record client baseline status
- [ ] Identify route mismatches
- [ ] Document list of broken endpoints/errors

### Phase 2: Authentication Hardening
- [x] Verify JWT middleware
- [x] Protect workflow routes (requireAuth)
- [x] Implement allowRoles middleware
- [x] Apply role guards to workflow create/update

### Phase 3: Roles & Users (DB-driven)
- [x] Ensure Role model exists
- [x] Seed initial roles (handled by app.js)
- [x] Ensure User schema has role reference
- [x] Add GET /api/roles
- [x] Add GET /api/users?role=ROLE_NAME
- [x] Update frontend AssignType dropdowns

### Phase 4: Workflow Definition Fixes
- [x] Validate WorkflowDefinition schema (steps, assignType)
- [x] Fix workflow create/edit APIs
- [x] Update admin pages (Multi-role support added)

### Phase 5: Request Creation + Assignment Engine
- [ ] Fix createRequest logic (status, history, assignment)
- [ ] Implement assignment rules (USER vs ROLE)

### Phase 6: Visibility & Query Security
- [x] Implement `buildRequestVisibilityQuery` (Handled via getMyTasks for now)
- [x] Apply to list/detail endpoints
- [x] Verify security (forbidden access)

### Phase 7: Approve/Reject Flow
- [x] Implement /requests/:id/action endpoint
- [x] Handle APPROVE logic (history, next step, status)
- [x] Handle REJECT logic (history, status)
- [x] Prevent double actions

### Phase 8: Frontend Consistency & Cleanup
- [ ] Standardize API response handling
- [ ] Clean up console errors
- [ ] Add UI guards (hide unauthorized buttons)

### Phase 9: Verification
- [ ] Manual verification checklist
- [ ] Automated tests (optional)

## Discovered During Audit
*(No items yet)*

## Completed Changes Log
*(No changes yet)*
