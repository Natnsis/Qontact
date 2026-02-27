import { z } from "zod";

export const PhoneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  number: z.string().min(10, "Phone must be at least 10 digits"),
  id: z.string().optional(),
  createdAt: z.string().optional(),
});

export type PhoneType = z.infer<typeof PhoneSchema>;
