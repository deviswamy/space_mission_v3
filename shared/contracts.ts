// Zod request/response schemas — single source of truth for API contracts.
// server/ uses safeParse(req.body); client/ uses zodResolver(Schema) in forms.

import { z } from "zod";

export const InviteUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["mission_lead", "crew_member"]), // directors cannot be invited
});

export type InviteUserInput = z.infer<typeof InviteUserSchema>;

// TODO: CreateMissionSchema — Feature 2
// TODO: UpdateProfileSchema — Feature 3
