import { z } from 'zod';

export const LoginDTOSchema = z
    .object({
        email: z
            .string()
            .email('Email không hợp lệ')
            .max(255),

        password: z
            .string()
            .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
            .max(100),

        rememberMe: z
            .boolean()
            .optional()
            .default(false),
    })
    .strict();

export type LoginDTO = z.infer<typeof LoginDTOSchema>;