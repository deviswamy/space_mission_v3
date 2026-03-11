// Branded IDs — passing the wrong ID type is a compile error.
// Usage: `const id = "abc" as OrgId`

export type OrgId = string & { readonly __brand: "OrgId" };
export type UserId = string & { readonly __brand: "UserId" };
export type MissionId = string & { readonly __brand: "MissionId" };
export type SkillId = string & { readonly __brand: "SkillId" };
export type AssignmentId = string & { readonly __brand: "AssignmentId" };
