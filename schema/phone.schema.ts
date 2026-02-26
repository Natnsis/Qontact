import { z } from 'zod';

export const PhoneSchema = z.object({
  name: z.string().min(5).max(10),
  number: z.number().min(10).max(15)
});

export type PhoneType = z.infer<typeof PhoneSchema>;
