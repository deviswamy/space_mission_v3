// Auth routes — delegates to better-auth handler.
// better-auth handles /sign-in, /sign-out, /get-session internally.

import { Router } from "express";
import { auth } from "../lib/auth";

export const authRouter = Router();

// Delegate all /api/auth/* requests to better-auth
authRouter.all("/*", async (req, res) => {
  // TODO: implement better-auth request handler integration
  res.status(501).json({ error: "Not implemented" });
});
