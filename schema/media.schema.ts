import { z } from "zod";

export const MediaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().min(1, "Username or URL is required"),
  id: z.string().optional(),
  createdAt: z.string().optional(),
  platform: z.string()
});

export type MediaType = z.infer<typeof MediaSchema>;
