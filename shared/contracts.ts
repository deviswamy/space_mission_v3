// Zod request/response schemas — single source of truth for API contracts.
// server/ uses safeParse(req.body); client/ uses zodResolver(Schema) in forms.

import { z } from "zod";

export const InviteUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["mission_lead", "crew_member"]), // directors cannot be invited
  temporaryPassword: z.string().min(8),
});

export type InviteUserInput = z.infer<typeof InviteUserSchema>;

export const ChangePasswordSchema = z.object({
  newPassword: z.string().min(8),
});
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

// TODO: CreateMissionSchema — Feature 2
// TODO: UpdateProfileSchema — Feature 3
