# Task 11 - API Routes Builder Work Log

## Summary
Created all 14 API route files for the CRM application with full CRUD operations, filtering, and business logic.

## Files Created

### 1. `/src/app/api/pipeline-stages/route.ts`
- **GET**: List all pipeline stages ordered by `order` field, includes lead count
- **POST**: Create a new pipeline stage (requires name and order)

### 2. `/src/app/api/pipeline-stages/[id]/route.ts`
- **PUT**: Update a pipeline stage (partial update with all optional fields)
- **DELETE**: Delete a pipeline stage (prevents deletion if leads exist in stage)

### 3. `/src/app/api/leads/route.ts`
- **GET**: List leads with optional filters: status, pipelineStageId, priority, channel, search (searches firstName, lastName, phone, email)
- **POST**: Create a new lead (auto-sets lastContact, creates "note" interaction for creation log)

### 4. `/src/app/api/leads/[id]/route.ts`
- **GET**: Get single lead with pipelineStage, tasks, and interactions
- **PUT**: Update a lead (creates stage_change interaction if pipelineStageId changes, updates lastContact on contact-related field changes)
- **DELETE**: Delete a lead

### 5. `/src/app/api/leads/[id]/move/route.ts`
- **PUT**: Move lead to different pipeline stage (creates stage_change interaction in transaction, updates lastContact)

### 6. `/src/app/api/tasks/route.ts`
- **GET**: List tasks with filters: completed, leadId, dueBefore, overdue
- **POST**: Create a new task (validates lead existence)

### 7. `/src/app/api/tasks/[id]/route.ts`
- **PUT**: Update a task (if completing, sets completedAt and creates task_completed interaction on lead)
- **DELETE**: Delete a task

### 8. `/src/app/api/interactions/route.ts`
- **GET**: List interactions with filters: leadId, type. Ordered by createdAt desc. Includes lead relation.
- **POST**: Create a new interaction (updates lead's lastContact)

### 9. `/src/app/api/whatsapp-templates/route.ts`
- **GET**: List WhatsApp templates with filters: category, isActive
- **POST**: Create a new WhatsApp template

### 10. `/src/app/api/whatsapp-templates/[id]/route.ts`
- **PUT**: Update a WhatsApp template
- **DELETE**: Delete a WhatsApp template

### 11. `/src/app/api/ai-prompts/route.ts`
- **GET**: List AI prompts with filter: category
- **POST**: Create a new AI prompt

### 12. `/src/app/api/ai-prompts/[id]/route.ts`
- **PUT**: Update an AI prompt
- **DELETE**: Delete an AI prompt

### 13. `/src/app/api/metrics/route.ts`
- **GET**: Returns computed metrics:
  - leadsByStatus, leadsByStage (with color/order), leadsByChannel
  - conversionRate (won/total * 100)
  - tasks (completed vs pending)
  - recentLeads (last 7 days)
  - overdueFollowUps (nextFollowUp < now AND status=active)
  - leadsByPriority, totalLeads

### 14. `/src/app/api/seed/route.ts`
- **POST**: Seeds database with:
  - 8 pipeline stages for health plan sales pipeline
  - 8 example leads with realistic Argentine data across all stages
  - 7 tasks (2 completed, 5 pending including overdue)
  - 25 interactions (notes, WhatsApp sent/received, stage changes, calls, emails, task completions)
  - 9 WhatsApp templates (3 tones each: formal, friendly, brief)
  - 5 AI prompts for CRM operations

## Key Implementation Details
- All routes use Next.js 16 App Router format with async params (Promise pattern)
- Proper error handling with try/catch and appropriate HTTP status codes
- Uses `db` from `@/lib/db` for all database operations
- Business logic: stage changes auto-create interactions, task completion creates interactions, lead updates trigger lastContact refresh
- All routes verified working via curl tests
- Lint passes with zero errors

## Testing Results
- `POST /api/seed` → 200, seeded 8 stages, 8 leads, 7 tasks, 25 interactions, 9 templates, 5 prompts
- `GET /api/pipeline-stages` → 200, returns stages with leadCount
- `GET /api/leads` → 200, returns leads with pipelineStage
- `GET /api/metrics` → 200, returns all computed metrics
- `PUT /api/leads/[id]/move` → 200, creates stage_change interaction
- `GET /api/interactions?leadId=...` → 200, returns interactions with lead relation
- `GET /api/tasks?overdue=true` → 200, filters overdue tasks
- `GET /api/whatsapp-templates` → 200, returns all templates
- `GET /api/ai-prompts` → 200, returns all prompts
