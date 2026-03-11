// Express app factory — no app.listen() here so the app is importable in tests.

import express from "express";
import { globalErrorHandler } from "./lib/errors";
import { router } from "./routes/index";

export const app = express();

app.use(express.json());

// Mount all routes under /api
app.use("/api", router);

// Global error handler — must be last middleware
app.use(globalErrorHandler);
