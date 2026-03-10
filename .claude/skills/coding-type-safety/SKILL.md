---
name: coding-type-safety
description: "TypeScript strict typing rules and Zod validation patterns for this project. Use when writing any TypeScript code, defining types or interfaces, creating Zod schemas, deciding between shared/ and feature-local types, composing types with Pick/Omit/intersection, adding runtime validation, or fixing type errors. Covers: no 'as any' rule, type composition patterns, shared types organization, and validation-first approach. MUST be consulted for any new TypeScript file or type definition."
---

# Mission Control Type Safety Standards

Strict TypeScript type safety is enforced throughout the codebase. This skill covers typing rules, validation patterns, and type organization.

---

## Strict Typing Rules

**CRITICAL: No unsafe type casting is allowed in the codebase.**

### Forbidden Patterns

```typescript
// ❌ NEVER do this
const data = record.data as SomeType;
const user = req.user as any;
const query = query.where(...) as any;
```

### Safe Alternatives

#### 1. Zod Runtime Validation

```typescript
// ✅ Good - Zod validates at runtime
const parseResult = SomeTypeSchema.safeParse(record.data);
if (!parseResult.success) {
  return Err('Invalid data format');
}
const data = parseResult.data; // Properly typed!
```

#### 2. Type Guards

```typescript
// ✅ Good - proper type guard
interface AuthenticatedRequest extends Request {
  user?: {
    claims: {
      sub: string;
    };
  };
}

function getUserAddress(req: AuthenticatedRequest): string {
  return req.user?.claims?.sub || 'placeholder';
}
```

#### 3. Type Narrowing

```typescript
// ✅ Good - check before accessing
if (event.iconType && event.iconType in iconMap) {
  const icon = iconMap[event.iconType];
}
```

#### 4. `as const` (Literal Types)

`as const` is not a cast — it narrows a value to its literal type and is always safe.

```typescript
// ✅ Good - as const for literal types
const config = {
  type: 'execute-job' as const,
  priority: 'high' as const,
};
```

---

## Type Inference

### Prefer Inference for Variables

```typescript
// ❌ Redundant
const count: number = 5;
const name: string = 'Alice';

// ✅ Let TypeScript infer
const count = 5;
const name = 'Alice';
```

### Always Type Functions

```typescript
// ✅ Good - explicit parameter and return types
function calculateScore(user: User, multiplier: number): number {
  return user.points * multiplier;
}

// ✅ Good - async functions
async function fetchUser(id: string): Promise<User | null> {
  // ...
}
```

---

## Drizzle ORM Types

**Always infer types from the Drizzle schema — never write them manually.**

```typescript
import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';

export const crew = pgTable('crew', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  orgId: uuid('org_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ✅ Infer from schema — single source of truth
export type Crew = typeof crew.$inferSelect;        // Full row type
export type NewCrew = typeof crew.$inferInsert;     // Insert type (id/createdAt optional)

// ✅ Compose from inferred type
export type CrewSummary = Pick<Crew, 'id' | 'name' | 'orgId'>;

// ❌ Never manually redeclare
export type Crew = {
  id: string;
  name: string;
  orgId: string;
  createdAt: Date;
};
```

Use `$inferSelect` for query results, `$inferInsert` for insert payloads. Compose further types from these using `Pick`/`Omit`/`&`.

---

## Type Composition Rule

**This rule applies everywhere** - API types, service types, component props, utility types.

When defining a type that shares fields with an existing type, **always compose from the existing type** using `Pick`, `Omit`, or `&`. **Never** re-declare fields inline.

### Extending a Type (Add Fields)

```typescript
export type AgentToken = typeof agentTokens.$inferSelect;

// ✅ Good - reuse AgentToken and extend it
export type AgentTokenWithMeta = AgentToken & {
  lastUsedAt: Date | null;
  source: 'api' | 'ui';
};

// ❌ Bad - AgentToken fields duplicated inline
export type AgentTokenWithMeta = {
  id: string;
  agentId: string;
  label: string;
  secret: string;
  createdAt: Date;
  updatedAt: Date;
} & {
  lastUsedAt: Date | null;
  source: 'api' | 'ui';
};
```

### Narrowing a Type (Select Subset)

```typescript
// ✅ Good - narrow from AgentToken
export type AgentTokenSummary = Pick<AgentToken, 'agentId' | 'label' | 'createdAt'>;

// ❌ Bad - re-declaring shape inline
export type AgentTokenSummary = {
  agentId: string;
  label: string;
  createdAt: Date;
};
```

### Omitting Fields

```typescript
// ✅ Good - readable + reusable intermediate type
export type AgentTokenInternal = AgentToken & {
  decryptedToken: string;
  auditLogId: string;
};
export type SafeAgentToken = Omit<AgentTokenInternal, 'secret' | 'decryptedToken'>;

// ❌ Bad - anonymous type soup, hard to reuse/read
export type SafeAgentToken = Omit<
  AgentToken & { decryptedToken: string } & { auditLogId: string },
  'secret' | 'decryptedToken'
>;
```

### Document Field Mappings

When type maps fields with different names, **always document the mapping**:

```typescript
/**
 * Scoring event for API response
 *
 * Composes from ScoringEventData (protocol layer) with record metadata.
 * Maps protocol field names to API-friendly names.
 */
export interface ScoringEventDto extends Pick<ScoringEventData, 'reason' | 'metadata'> {
  id: string; // Protocol record ID
  address: string; // Maps from target_address
  amount: number; // Maps from delta
  timestamp: number; // Protocol record timestamp
}
```

---

## Shared Types Organization

Types used by both frontend and backend **MUST** be defined in `shared/`.

### Type Locations

| Location | Purpose | Example |
|----------|---------|---------|
| `shared/schema/*.ts` | Database tables, protocol types, node types | Base types to compose from |
| `shared/branded-types.ts` | Type-safe IDs | `OrgId`, `UserId` |
| `shared/dtos.ts` | API response types | Compose from schema types |
| `shared/endpoint-descriptors.ts` | Zod schemas for API contracts | Request/response validation |

### Creating New Types

1. **Check schema first** - Look in `shared/` for existing data types
2. **Compose, don't duplicate** - Use `Pick`, `Omit`, or `&` from existing types
3. **Place correctly** - Use the locations above to decide where to define it
4. **Document mappings** - Add JSDoc if field names differ from source

---

## What Does NOT Belong in `shared/`

### ❌ Frontend-Only Concerns

```typescript
// DON'T put in shared/
// React component props
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
}

// UI state or view models
interface DashboardState {
  isExpanded: boolean;
  selectedTab: string;
}

// Form-specific types
interface LoginFormValues {
  email: string;
  password: string;
}
```

**Belongs in:** Component file or frontend module

### ❌ Backend-Only Domain Logic

```typescript
// DON'T put in shared/
// Internal aggregates
interface PolicyEngineState {
  ruleCache: Map<string, Rule>;
  lastEvaluationTime: number;
}

// Persistence-only fields
interface JobInternalState {
  retryCount: number;
  lastError: string;
}
```

**Belongs in:** Backend domain layer

### ❌ Feature-Local Abstractions

Types used by only one module should stay in that module:

```typescript
// In client/src/features/dashboard/types.ts
interface DashboardWidget {
  // Only used by dashboard feature
}

// In server/scoring/types.ts
interface ScoringCalculation {
  // Only used by scoring service
}
```

---

## Zod Schema Patterns

### Basic Schema Definition

```typescript
import { z } from 'zod';

// Define schema
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['user', 'admin']),
  createdAt: z.string().datetime(), // Dates as ISO strings over the wire
});

// Infer TypeScript type from schema
type User = z.infer<typeof UserSchema>;
```

### Safe Parsing

```typescript
// For untrusted input - never throws
const result = UserSchema.safeParse(unknownData);
if (result.success) {
  const user = result.data; // Typed as User
} else {
  console.error(result.error.issues);
}

// For trusted input - throws on invalid
const user = UserSchema.parse(trustedData);
```

### Optional and Default Values

```typescript
const ConfigSchema = z.object({
  timeout: z.number().default(5000),
  retries: z.number().optional(),
  enabled: z.boolean().default(true),
});
```

### Transformations

```typescript
const DateSchema = z.string()
  .datetime()
  .transform((str) => new Date(str));
```

---

## Quick Reference

### Type Casting Alternatives

| Instead Of | Use |
|------------|-----|
| `x as SomeType` | Zod `safeParse()` |
| `x as any` | Proper type guard |
| `x as unknown as Y` | Type narrowing with `if` |
| `(x as any).field` | Optional chaining `x?.field` |

### Composition Patterns

| Pattern | When to Use |
|---------|-------------|
| `Pick<T, K>` | Select subset of fields |
| `Omit<T, K>` | Remove fields |
| `T & U` | Extend with new fields |
| `Partial<T>` | Make all fields optional |
| `Required<T>` | Make all fields required |

### Shared Type Decision Tree

```
Is type used by both frontend AND backend?
├── Yes → Put in shared/
│   ├── Is it a database/protocol type? → shared/schema/
│   ├── Is it a type-safe ID? → shared/branded-types.ts
│   ├── Is it an API response? → shared/dtos.ts
│   └── Is it for API validation? → shared/endpoint-descriptors.ts
└── No → Keep in feature/module
```

---

## Common Errors and Fixes

### Error: Property does not exist on type

```typescript
// ❌ Error
const name = record.data.name; // Property 'name' does not exist

// ✅ Fix - validate with Zod
const parsed = RecordDataSchema.safeParse(record.data);
if (parsed.success) {
  const name = parsed.data.name; // Type-safe
}
```

### Error: Argument of type X is not assignable to Y

```typescript
// ❌ Error - often from as any casts
const result = await query as any;

// ✅ Fix - use proper return type
const result: QueryResult = await query;
```

### Error: Index signature for type not found

```typescript
// ❌ Error
const icon = iconMap[event.iconType];

// ✅ Fix - narrow first
if (event.iconType && event.iconType in iconMap) {
  const icon = iconMap[event.iconType as keyof typeof iconMap];
}
```

---

## Related Skills

- **coding-api-design**: Endpoint descriptors use Zod schemas
- **coding-documentation**: Document type mappings
- **coding-server-development**: Zod validation in handlers

---

## Related Files

- `shared/schema/` - Database and protocol types
- `shared/branded-types.ts` - Type-safe IDs
- `shared/dtos.ts` - API response types
- `shared/endpoint-descriptors.ts` - Zod API contracts
- `docs/code-guidelines.md` - Full type safety guidelines
