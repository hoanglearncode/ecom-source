import { z } from 'zod';

/**
 * Register DTO Schema
 */
export const RegisterDTOSchema = z
    .object({
        email: z
            .string()
            .trim()
            .email('Email không hợp lệ')
            .max(255),

        password: z
            .string()
            .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
            .max(100),

        confirmPassword: z
            .string()
            .min(8)
            .max(100),

        username: z
            .string()
            .trim()
            .min(1)
            .max(100)
            .optional(),

        phone: z
            .string()
            .trim()
            .max(20)
            .optional(),
    })
    .strict()
    .refine(
        (data) => data.password === data.confirmPassword,
        {
            message: 'Mật khẩu xác nhận không khớp',
            path: ['confirmPassword'],
        },
    );

export type RegisterDTO = z.infer<typeof RegisterDTOSchema>;