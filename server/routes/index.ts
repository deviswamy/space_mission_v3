import { Router } from "express";
import { authRouter } from "./auth";
import { inviteRouter } from "./admin/invite";

export const router = Router();

router.use("/auth", authRouter);
router.use("/admin", inviteRouter);

// TODO: mount missions, assignments, crew, profile, skills routers (Feature 2+)
