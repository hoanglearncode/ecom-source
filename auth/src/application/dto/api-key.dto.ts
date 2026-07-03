import { z } from 'zod';

/**
 * Create API Key DTO Schema
 */
export const CreateApiKeyDTOSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, 'Tên API Key là bắt buộc')
            .max(100, 'Tên API Key không được vượt quá 100 ký tự'),

        scopes: z
            .array(z.string().trim().min(1))
            .optional()
            .default([]),

        ipWhitelist: z
            .array(z.string())
            .optional()
            .default([]),

        rateLimit: z
            .number()
            .int()
            .positive()
            .optional(),

        expiresAt: z
            .coerce
            .date()
            .optional(),
    })
    .strict();

export type CreateApiKeyDTO = z.infer<typeof CreateApiKeyDTOSchema>;