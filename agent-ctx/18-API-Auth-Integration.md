# Task 18 - API Auth Integration Work Log

## Summary
Updated all 13 existing API route files to require authentication and filter data by the authenticated user's userId. Also created the prerequisite auth infrastructure files.

## Files Created

### 1. `/src/lib/auth.ts`
- NextAuth.js v4 configuration with Credentials provider
- JWT session strategy
- Callbacks that attach `id` and `role` to the JWT token and session
- Sign-in page configured at `/login`

### 2. `/src/lib/auth-helpers.ts`
- `getAuthUserId()`: Returns userId or null (for optional auth)
- `requireAuth()`: Returns userId or throws "No autorizado" error

## Files Modified

### 3. `/src/app/api/pipeline-stages/route.ts`
- **GET**: Added `where: { userId }` filter
- **POST**: Added `userId` to create data

### 4. `/src/app/api/pipeline-stages/[id]/route.ts`
- **PUT**: Added ownership verification (`existing.userId !== userId`)
- **DELETE**: Added ownership verification

### 5. `/src/app/api/leads/route.ts`
- **GET**: Added `where: { userId }` base filter
- **POST**: Added `userId` to lead create, verified pipelineStage belongs to user, added `userId` to interaction create

### 6. `/src/app/api/leads/[id]/route.ts`
- **GET**: Added ownership verification
- **PUT**: Added ownership verification, verified new pipelineStage belongs to user, added `userId` to stage_change interaction
- **DELETE**: Added ownership verification

### 7. `/src/app/api/leads/[id]/move/route.ts`
- **PUT**: Added ownership verification, verified target pipelineStage belongs to user, added `userId` to interaction

### 8. `/src/app/api/tasks/route.ts`
- **GET**: Added `where: { userId }` base filter
- **POST**: Verified lead belongs to user, added `userId` to create

### 9. `/src/app/api/tasks/[id]/route.ts`
- **PUT**: Added ownership verification, added `userId` to task_completed interaction
- **DELETE**: Added ownership verification

### 10. `/src/app/api/interactions/route.ts`
- **GET**: Added `where: { userId }` base filter
- **POST**: Verified lead belongs to user, added `userId` to create

### 11. `/src/app/api/whatsapp-templates/route.ts`
- **GET**: Public (no auth required) - global model
- **POST**: Requires auth (any authenticated user can create) - global model, no userId

### 12. `/src/app/api/whatsapp-templates/[id]/route.ts`
- **PUT**: Requires auth - global model, no userId ownership check
- **DELETE**: Requires auth - global model, no userId ownership check

### 13. `/src/app/api/ai-prompts/route.ts`
- **GET**: Public (no auth required) - global model
- **POST**: Requires auth - global model, no userId

### 14. `/src/app/api/ai-prompts/[id]/route.ts`
- **PUT**: Requires auth - global model, no userId ownership check
- **DELETE**: Requires auth - global model, no userId ownership check

### 15. `/src/app/api/metrics/route.ts`
- **GET**: All queries (lead.groupBy, lead.findMany, lead.count, task.count) filtered by `where: { userId }`

## Auth Pattern Applied Consistently

### User-scoped models (Lead, Task, Interaction, PipelineStage, DailyMetric):
- `requireAuth()` at the start of every handler
- `where: { userId }` on all findMany/count/groupBy queries
- `userId` added to all create operations
- Ownership verification before update/delete: `if (existing.userId !== userId) return 401`

### Global models (WhatsAppTemplate, AIPrompt):
- GET: No auth required (public read)
- POST/PUT/DELETE: `requireAuth()` only (no userId filtering since they're shared resources)

### Error Handling:
- 401 for "No autorizado" (unauthenticated or wrong ownership)
- 404 for entity not found
- 400 for validation errors
- 500 for internal errors

## Verification
- Lint passes with only 1 pre-existing warning (TanStack Table React Compiler)
- Prisma client regenerated with `bun run db:push` to include Session/Account models
