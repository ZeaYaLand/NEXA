import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string().trim().max(10000).default(''),
  visibility: z.enum(['public', 'followers', 'private']).default('public'),
  media: z.array(z.object({
    url: z.string().url().max(2048),
    type: z.string().min(1).max(100),
  })).max(20).default([]),
}).refine((value) => value.content.length > 0 || value.media.length > 0, {
  message: 'Post must contain text or media',
});

export const commentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  parentId: z.string().uuid().optional(),
});
