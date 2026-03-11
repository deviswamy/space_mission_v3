// API response shapes — composed from Drizzle $inferSelect types.
// Import these in both server routes (return type) and client hooks (query type).

import type { Org, Skill, User } from "./schema/index";

export type OrgDto = Pick<Org, "id" | "name" | "slug">;

export type UserDto = Pick<User, "id" | "name" | "email" | "role" | "orgId">;

export type SkillDto = Pick<Skill, "id" | "name" | "orgId">;

// TODO: MissionDto — Feature 2
// TODO: AssignmentDto — Feature 2
// TODO: CrewMemberDto — Feature 3
