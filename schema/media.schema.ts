import { z } from 'zod';

export const UrlSchema = z.object({
  url: z.string().url('Invalid URL format').startsWith('https://', 'only secure links allowed')
});

export type UrlType = z.infer<typeof UrlSchema>;
