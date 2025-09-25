# AI Agent Development Management

This document defines the rules and processes for managing development work across the backlog and task list, enabling multiple AI agents to work in parallel while maintaining coordination and progress tracking.

## File Structure Overview

```
plan/
├── backlog.md              # User stories organized by release/epic
├── task-list.md            # Technical tasks mapped to stories
├── bkl-completed.md        # Completed user stories
├── tasks-completed.md      # Completed technical tasks
├── demand-mgt.md           # This file - management rules
└── progress-tracker.md     # Overall project progress (auto-generated)
```

## Core Management Principles

### 1. Work Item States
- **Available**: Ready to be claimed by any AI agent
- **In Progress**: Agent actively working on the item (automatically set when claimed)
- **Under Review**: Work completed, awaiting human acceptance
- **Completed**: Human-approved, tested, and moved to completion files

### 2. AI Agent Work Protocol
- Agents MUST claim work before starting (claim = immediate start)
- Only ONE agent can work on an item at a time
- Claiming immediately transitions item to "In Progress"
- No time limits - agents work continuously until completion

### 3. Dependency Management
- Check ALL dependencies before claiming work
- Dependencies MUST be in "Completed" state
- Cross-reference between backlog.md and task-list.md
- Agents cannot claim blocked work items

## AI Agent Workflow

### A. Claiming and Starting Work

**Step 1: Choose Available Work**
- Review `backlog.md` for user stories OR `task-list.md` for technical tasks
- Verify ALL dependencies are in "Completed" state
- Ensure no other agent has claimed the item

**Step 2: Claim and Begin Work**
- Add status marker: `**[IN PROGRESS by @agent-name - YYYY-MM-DD]**` after the story/task title
- Begin immediate implementation (no separate claiming phase)
- Update both backlog.md AND task-list.md if the work spans both

**Example:**
```markdown
**Story R0-001: User Registration** **[IN PROGRESS by @claude-dev - 2025-01-15]**
- **As a** new user, **I want to** create an account...
```

**Step 3: Continuous Development**
- Work continuously until all acceptance criteria are met
- Implement code, tests, and documentation
- No intermediate status updates required

### B. Completing Work

**Transition to Review**
- Change status when implementation is complete: `[IN PROGRESS]` → `[UNDER REVIEW]`
- Add completion marker with implementation summary

**Example:**
```markdown
**Story R0-001: User Registration** **[UNDER REVIEW by @claude-dev - 2025-01-15, completed 2025-01-15]**
<!-- IMPLEMENTATION COMPLETE:
✓ Email-based signup form at /signup
✓ Required fields: email, password, name, handle validation
✓ Email validation and password strength requirements
✓ Handle uniqueness validation
✓ Tests written and passing
✓ Documentation updated
-->
- **As a** new user, **I want to** create an account...
```

**Human Acceptance Required**
- Work remains in "Under Review" until human approves
- Agent waits for explicit acceptance command
- No automatic progression to "Completed"

### C. Human-Driven Completion Process

**Human Acceptance Command**
- Only humans can approve and move items to "Completed"
- Human reviews the "Under Review" work and either:
  - **Accepts**: Issues completion command
  - **Requests Changes**: Provides feedback, item returns to "In Progress"

**Upon Human Acceptance**
The accepting agent will:

**Step 1: Move to Completion Files**
- Copy the ENTIRE story/task block (including all metadata and comments)
- Paste into appropriate completion file:
  - Stories: `plan/bkl-completed.md`
  - Tasks: `plan/tasks-completed.md`
- Add completion metadata:
  ```markdown
  **COMPLETION INFO:**
  - Agent: @claude-dev
  - Started: 2025-01-15
  - Completed: 2025-01-15
  - Implementation: Same-day completion
  - Related Files/Changes: [list of files modified]
  - Human Approved: 2025-01-16 by @project-manager
  - Notes: [any special notes from human review]
  ```

**Step 2: Remove from Active Files**
- Delete the completed item from `backlog.md` or `task-list.md`
- Update any dependent items that are now unblocked (change from blocked to available)
- Commit changes with clear message: `Complete Story R0-001: User Registration (Human Approved)`

## Multi-Agent Coordination

### Conflict Prevention
- **Check Before Claiming**: Always read latest file versions before claiming work
- **Atomic Operations**: Complete work in single session to avoid conflicts
- **Clear Markers**: Use precise status markers to prevent double-claiming
- **Respect Claims**: Never override another agent's active work

### Dependency Chain Management
- **Dependency Verification**: Strict checking of completed dependencies before starting
- **Unblocking Work**: When completing work, identify and unblock dependent items
- **Chain Optimization**: Prioritize work that unblocks the most dependent items

### Work Distribution Guidelines

**Story vs Task Selection**
- **Stories** (backlog.md): User-facing features, business logic, UX/UI work
- **Tasks** (task-list.md): Infrastructure, technical implementation, DevOps

**Agent Specialization**
- **Frontend Agent**: Focus on UI stories and client-side tasks
- **Backend Agent**: API tasks, data modeling, server-side logic
- **Infrastructure Agent**: Build systems, deployment, monitoring tasks
- **Full-Stack Agent**: Can work across both stories and tasks

**Parallel Work Strategy**
- Agents can work simultaneously on independent items
- No artificial limits - agents work continuously until completion
- Prioritize items with no dependencies to maximize parallelization

## Progress Tracking

### Agent Status Markers
The following markers are used for progress tracking:

```markdown
<!-- No marker = AVAILABLE -->
**[IN PROGRESS by @agent-name - YYYY-MM-DD]**
**[UNDER REVIEW by @agent-name - started YYYY-MM-DD, completed YYYY-MM-DD]**
**[COMPLETED - Human approved YYYY-MM-DD]** (only in completion files)
**[BLOCKED: dependency/issue - @agent-name]**
```

### Release Progress Tracking
- Each release maintains completion percentage based on completed stories
- Updated automatically when items moved to completion files
- Dependencies track which items are unblocked by completions

## Agent Protocols

### Conflict Resolution
If two agents attempt to claim the same work:
1. **First marker wins** - check file timestamps
2. Conflicting agent must find alternative available work
3. No escalation needed - agents self-resolve

### Dependency Blocking
When work becomes blocked by missing dependencies:
1. Agent cannot claim blocked work
2. Mark clearly: `**[BLOCKED: waiting for Story R0-XXX]**`
3. Find alternative available work
4. Return when dependencies are completed

### Error Handling
If an agent encounters implementation issues:
1. Continue working until resolution or impossibility
2. If impossible: mark as `**[BLOCKED: technical issue - details]**`
3. Report to human for guidance
4. Do not abandon work - wait for human intervention

## Quality Gates

### Before Claiming Work
- [ ] ALL dependencies are in "Completed" state
- [ ] Story/task acceptance criteria clearly understood
- [ ] No other agent has claimed the item
- [ ] Technical approach is feasible

### Before Marking "Under Review"
- [ ] ALL acceptance criteria implemented and tested
- [ ] Code follows established project patterns
- [ ] Documentation created/updated as needed
- [ ] Self-validation completed
- [ ] Implementation summary prepared

### Human Acceptance Criteria
The human reviewer will check:
- [ ] Acceptance criteria fully met
- [ ] Code quality meets standards
- [ ] Tests demonstrate functionality
- [ ] Documentation is adequate
- [ ] No breaking changes to existing functionality

## Agent Operation Commands

### Status Checking
```bash
# See all active work
grep -r "IN PROGRESS\|UNDER REVIEW" plan/

# Check specific agent's work
grep -r "@agent-name" plan/backlog.md plan/task-list.md

# View completion stats
wc -l plan/*completed.md

# Check available work (items with no status markers)
grep -L "IN PROGRESS\|UNDER REVIEW\|COMPLETED\|BLOCKED" plan/backlog.md plan/task-list.md
```

## Agent Best Practices

### Work Selection Strategy
- **Dependency First**: Choose work that unblocks the most dependent items
- **Foundation First**: Prioritize infrastructure tasks that enable other work
- **Parallel Opportunities**: Select work that doesn't conflict with other active items

### Implementation Quality
- **Standards Compliance**: Follow established patterns from tech-spec.md
- **Complete Implementation**: Address ALL acceptance criteria before marking "Under Review"
- **Self-Validation**: Test implementation thoroughly before human review
- **Clear Documentation**: Explain what was implemented and how it works

### Coordination Protocol
- **Status Accuracy**: Keep status markers current and accurate
- **Dependency Updates**: When completing work, identify newly available dependent items
- **Blocking Communication**: Clearly document any blockers encountered
- **Completion Summaries**: Provide comprehensive implementation details for human review

---

## Example AI Agent Workflow

**Scenario**: AI agent works on user authentication

**Step 1: Agent Reviews Available Work**
```bash
# Agent scans for available work
grep -A5 -B2 "authentication\|login\|auth" plan/backlog.md

# Found: Story R0-002: User Authentication
# Check dependencies: Story R0-001: User Registration
grep "R0-001" plan/*completed.md  # ✓ Found in bkl-completed.md
```

**Step 2: Agent Claims and Starts Work**
```markdown
# In backlog.md - Agent immediately starts work upon claiming
**Story R0-002: User Authentication** **[IN PROGRESS by @claude-dev - 2025-01-20]**
- **As a** registered user, **I want to** sign in with my credentials...

# Related task in task-list.md
**Task R1-T001: Netlify Identity Integration** **[IN PROGRESS by @claude-dev - 2025-01-20]**
```

**Step 3: Agent Completes Implementation**
```markdown
# Agent marks work complete and ready for human review
**Story R0-002: User Authentication** **[UNDER REVIEW by @claude-dev - 2025-01-20, completed 2025-01-20]**
<!-- IMPLEMENTATION COMPLETE:
✓ Login form at /login with email and password validation
✓ Remember me functionality implemented
✓ Error handling for invalid credentials
✓ Redirect to home page after successful login
✓ Password reset capability added
✓ Session management with security best practices
✓ All acceptance criteria met
✓ Tests written and passing
-->
- **As a** registered user, **I want to** sign in with my credentials...
```

**Step 4: Human Acceptance & Agent Completion**
```markdown
# Human approves work, agent moves to completion file
# Move to plan/bkl-completed.md
**Story R0-002: User Authentication** **[COMPLETED - Human approved 2025-01-21]**
- **As a** registered user, **I want to** sign in with my credentials...

**COMPLETION INFO:**
- Agent: @claude-dev
- Started: 2025-01-20
- Completed: 2025-01-20
- Implementation: Same-day completion
- Related Files/Changes: /login page, auth utilities, session management
- Human Approved: 2025-01-21 by @project-manager
- Notes: Complete implementation with Netlify Identity integration
```

This AI-optimized demand management system ensures efficient parallel development with human oversight of quality and acceptance.