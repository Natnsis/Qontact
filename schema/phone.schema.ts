import { z } from 'zod';

export const PhoneSchema = z.object({
  name: z.string('invalid name')
    .min(3, 'name too small')
    .max(18, 'name too big'),
  number: z.string('invalid number')
    .min(10, 'must be atleast 10 chars')
    .max(15, 'number too big')
});

export type PhoneType = z.infer<typeof PhoneSchema>;
