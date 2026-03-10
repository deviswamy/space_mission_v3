---
name: coding-documentation
description: "Documentation standards and JSDoc templates for this project. Use when adding JSDoc comments to files, documenting exported functions or classes, writing React component documentation, creating folder README files, or reviewing whether code documentation meets project standards. Covers file-level headers, exported item docs, public class members, React component props, and the 3-tier adoption priority system."
---

# Dialectica Documentation Standards

All code files, exported items, and key public members must be thoroughly documented. This skill covers the documentation templates, rules, and best practices for the Dialectica codebase.

## When to Use This Skill

- Writing new files (need file-level JSDoc header)
- Creating new exports (interfaces, classes, functions)
- Documenting React components
- Creating folder README files
- Code review for documentation quality
- Understanding documentation anti-patterns

---

## File-Level Documentation

**Every file must have a JSDoc-style file header** explaining:
- What this file contains and its purpose
- Its role in the overall architecture (which layer, which subsystem)
- Key exported items
- Integration points and dependencies
- Common usage patterns

### Template

```typescript
/**
 * Brief one-line description of the file's purpose
 *
 * **Architecture Layer:** [Protocol/Node/Agent/API/Utils/Client Component/etc.]
 *
 * Detailed explanation of what this file provides and its role in the system.
 * Explain the context and how it relates to other parts of the codebase.
 *
 * **Key Exports:**
 * - `ExportedClass`: Brief description of what it does
 * - `exportedFunction()`: Brief description of what it does
 * - `EXPORTED_CONSTANT`: Brief description of its purpose
 *
 * **Usage:**
 * ```typescript
 * import { ExportedClass } from './this-file';
 * const instance = new ExportedClass(config);
 * ```
 *
 * **Integration:**
 * - Used by: [Other modules/components that import this]
 * - Depends on: [Key dependencies]
 *
 * @module path/to/file
 */
```

### Example

```typescript
/**
 * Protocol Layer - Core append-only record store implementation
 *
 * **Architecture Layer:** Protocol Layer - Core Implementation
 *
 * Provides the blockchain-ready immutable record store that forms the foundation
 * of Dialectica's game mechanics. This layer validates and stores protocol records
 * (ISR, ISO, VFP) with cryptographic signatures and emits events for state changes.
 *
 * **Key Exports:**
 * - `ProtocolLayer`: Main protocol interface for record operations
 * - `RecordQuery`: Query interface for retrieving protocol records
 * - `ProtocolConfig`: Configuration for validation rules
 *
 * **Integration:**
 * - Used by: Node Layer (Indexer), API Layer (record submission)
 * - Depends on: ProtocolStore, ProtocolValidator, EventEmitter
 *
 * @module server/protocol/index
 */
```

---

## Exported Items Documentation

### Interfaces and Types

Explain what the interface represents and its role in architecture:

```typescript
/**
 * Configuration object for creating and initializing an agent.
 *
 * **Agent Layer - Configuration Interface**
 *
 * Contains all the metadata and settings needed to instantiate and identify an agent
 * in the system. This configuration is typically loaded from the database and used
 * by the AgentFactory to create the appropriate agent instance (internal or external).
 *
 * **Key Properties:**
 * - `id`: Unique identifier linking to database record
 * - `type`: Role of agent (ISP or IVSP) for opportunity matching
 * - `implementation`: Variant of agent (simple_llm, simple_verifier, or external)
 * - `config`: Implementation-specific settings (API keys, tokens, etc.)
 * - `isActive`: Whether agent should participate in work assignment
 */
export interface AgentConfig {
  id: string;
  type: AgentType;
  ownerAddress: string;
  implementation: 'simple_llm' | 'simple_verifier' | 'external';
  config: Record<string, any>;
  isActive: boolean;
}
```

### Classes

Explain responsibilities, lifecycle, and relationships:

```typescript
/**
 * Proxy for user-built external agents that connect via SSE/HTTP.
 *
 * **Agent Layer - Remote Worker Proxy**
 *
 * External agents are user-built services that connect to the platform to provide
 * custom ISP or IVSP capabilities. This class acts as a server-side proxy that
 * manages communication with the remote agent process.
 *
 * **Communication Pattern:**
 * - Server → Agent: SSE for work notifications (evaluate, execute)
 * - Agent → Server: HTTP POST for results (fitness scores, job completion)
 *
 * **Lifecycle States:**
 * - `offline`: No connection (agent won't receive work)
 * - `online`: Connected via SSE (can receive opportunities)
 *
 * **Integration:**
 * - Managed by: AgentRegistry (registration and discovery)
 * - Coordinated by: NodeOrchestrator (work assignment)
 * - Connected via: AgentConnectionManager (SSE/HTTP routing)
 */
export class ExternalAgent extends BaseAgent {
  // Implementation...
}
```

### Functions

Document parameters, return values, side effects, and usage examples:

```typescript
/**
 * Creates a successful Result containing a value.
 *
 * This is a helper function for constructing the success case of a Result type.
 * It wraps a value in a Result object with `ok: true`, indicating successful
 * execution of an operation.
 *
 * The error type is set to `never` because a successful Result cannot contain
 * an error value.
 *
 * @template T - The type of the success value
 * @param value - The success value to wrap
 * @returns A successful Result containing the value
 *
 * @example
 * ```typescript
 * // Return success from a validation function
 * function validateAge(age: number): Result<number, string> {
 *   if (age >= 0) {
 *     return Ok(age);
 *   }
 *   return Err('Age must be non-negative');
 * }
 * ```
 */
export function Ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}
```

### Constants and Enums

Explain purpose and categorization:

```typescript
/**
 * Standard error codes used across all API endpoints.
 *
 * Error codes are categorized by prefix:
 * - VALIDATION_*: Client-side validation errors (400)
 * - AUTH_*: Authentication/authorization errors (401/403)
 * - NOT_FOUND_*: Resource not found errors (404)
 * - PROTOCOL_*: Protocol-specific errors (400)
 * - SERVER_*: Server-side errors (500)
 */
export enum ApiErrorCode {
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  NOT_FOUND_RESOURCE = 'NOT_FOUND_RESOURCE',
  // ...
}
```

---

## Public Class Members

Document public methods and properties when they are:
- Non-obvious in purpose or behavior
- Part of the public API contract
- Have important side effects or constraints
- Critical for understanding the class

**Omit documentation for:**
- Obvious getters/setters with self-explanatory names
- Simple properties with clear names in context
- Private implementation details

```typescript
export class ProtocolLayer {
  /**
   * Appends a new record to the protocol log with validation.
   *
   * Validates the record against protocol rules (turn window, signatures, references)
   * and stores it in the append-only log. Emits events for state changes.
   *
   * @param record - The protocol record to append (ISR, ISO, VFP, etc.)
   * @returns Ok with record ID on success, Err with validation message on failure
   *
   * **Side Effects:**
   * - Increments turn counter if in new turn window
   * - Emits record-specific events (ISR_SUBMITTED, ISO_REVEALED, etc.)
   * - Updates protocol state in database
   */
  async appendRecord(record: ProtocolRecord): Promise<Result<string, string>> {
    // Implementation...
  }

  // Simple getter - no documentation needed
  get currentTurn(): number {
    return this._currentTurn;
  }
}
```

---

## React Components

Document purpose, props, and usage context:

```typescript
/**
 * Displays an ISO (Intelligence Service Output) card with answer preview,
 * verification status, and action buttons.
 *
 * **Client Component - ISO Display**
 *
 * Renders a compact card showing an ISO's key information including the answer text,
 * verification verdict, score, and agent attribution. Provides expand/collapse
 * functionality for long answers and click-through to detailed view.
 *
 * **Props:**
 * - `iso`: The ISO data object to display
 * - `isExpanded`: Whether to show full answer or preview (optional)
 * - `onVerify`: Callback when verify button is clicked (optional, IVSP agents only)
 *
 * **Used In:**
 * - ISR detail pages (showing all ISOs for a question)
 * - Agent dashboard (showing agent's submissions)
 * - Live activity feed
 *
 * @example
 * ```tsx
 * <ISOCard
 *   iso={isoData}
 *   isExpanded={false}
 *   onVerify={() => handleVerify(iso.id)}
 * />
 * ```
 */
export function ISOCard({ iso, isExpanded, onVerify }: ISOCardProps) {
  // Component implementation...
}
```

---

## Folder README Files

Each major folder must have a README.md explaining:
- Purpose and contents
- Role in architecture
- Key files and responsibilities
- Common patterns and conventions
- Integration points

### Template

```markdown
# [Folder Name] - [Brief Description]

## Overview

[2-3 paragraph explanation of the folder's purpose and role in the architecture]

## Files

- **`file1.ts`** - [Description of what this file provides]
  - Key exports: [List main exports]
  - Purpose: [Specific role]

- **`file2.ts`** - [Description]
  - [Details]

## Architecture Role

### Position in [Three-Layer/Overall] Architecture

[Mermaid diagram or description showing how this folder fits into the larger system]

### Data Flow

[Explanation of how data flows through this folder]

## Key Concepts

[Important patterns, abstractions, or design decisions in this folder]

## Usage Examples

[Common usage patterns with code examples]

## Future Enhancements

[Planned improvements or known limitations]
```

---

## Documentation Maintenance Rules

1. **Keep documentation in sync with code** - Update comments when changing functionality
2. **Explain the "why", not just the "what"** - Focus on intent and architectural decisions
3. **Use examples for complex concepts** - Show don't just tell
4. **Reference related components** - Help readers navigate the codebase
5. **Maintain architecture context** - Always explain which layer/subsystem
6. **Avoid redundancy** - Don't repeat obvious information from names
7. **Update README files** - When adding new files or major changes
8. **Review during code review** - Documentation is as important as code

---

## Anti-Patterns

### ❌ DON'T: Redundant Comments

```typescript
// This is the User interface
export interface User {
  id: string; // The user's ID
  name: string; // The user's name
}
```

### ✅ DO: Contextual Information

```typescript
/**
 * Represents a registered user in the Dialectica platform.
 *
 * Users can act as customers (posting ISRs), agents (running ISPs/IVSPs),
 * or both. User identity is managed via Better-Auth sessions.
 *
 * **Data Model - Core Entity**
 */
export interface User {
  id: string;
  name: string;
  publicKey: string; // Ed25519 public key for signature verification
}
```

### ❌ DON'T: Stale Documentation

```typescript
/**
 * Computes the user's total score.
 * @param coins - The coin count
 * @param reputation - The reputation score
 * @returns The total score
 */
function computeScore(coins: number, reputation: number, expertise: number): number {
  // Missing 'expertise' in documentation!
}
```

### ✅ DO: Synchronized Documentation

```typescript
/**
 * Computes the user's weighted score for leaderboard ranking.
 *
 * @param coins - Economic rewards earned
 * @param reputation - Quality contribution score
 * @param expertise - Domain competence value
 * @returns Weighted score (coins × 1 + reputation × 10 + expertise × 5)
 */
function computeScore(coins: number, reputation: number, expertise: number): number {
  return coins * 1 + reputation * 10 + expertise * 5;
}
```

---

## Scope Prioritization

### Priority 1 - Core Architecture (Immediate)
- Protocol Layer (`server/protocol/*`)
- Node Layer (`server/node/*`)
- Agent Layer (`server/agents/*`)
- Shared types (`shared/*`)
- API layer (`server/api/*`)

### Priority 2 - User-Facing Code (Next)
- Main pages (`client/src/pages/*`)
- Core components (`client/src/components/isr/*`, `iso/*`, `vfp/*`)
- API hooks (`client/src/hooks/api/*`)

### Priority 3 - Supporting Infrastructure (Later)
- Utility functions (`server/utils/*`, `client/src/lib/*`)
- UI primitives (`client/src/components/ui/*`) - Already documented by Shadcn
- Configuration files
- Test utilities

### Exceptions - No Documentation Required
- Auto-generated files (Drizzle migrations, build artifacts)
- Third-party library code
- Single-line trivial exports (e.g., `export const API_URL = '/api'`)
- Files under 10 lines with obvious purpose
- Test fixtures and mock data files

---

## Code Review Checklist

- [ ] File has JSDoc header with architecture context
- [ ] Exported items have JSDoc comments
- [ ] Non-obvious public methods are documented
- [ ] README.md exists if new folder created
- [ ] Examples provided for complex APIs
- [ ] No stale/outdated documentation

---

## Long-term Goals

| Goal | Target |
|------|--------|
| Folders with README.md | 100% |
| Exported items documented | 90% |
| Files with headers | 80% |
| New code documented | 100% (enforced) |

---

## Related Skills

- **coding-type-safety**: Type documentation and Zod schemas
- **coding-api-design**: API endpoint documentation patterns

---

## Related Files

- `docs/code-guidelines.md` - Full documentation standards
- Template folders with README.md examples throughout codebase
