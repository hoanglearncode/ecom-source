import { z } from 'zod';
import { UserRole, UserStatus } from '@/domain/entity/user.entity.js';
export const UserDTOSchema = z.object({
    id: z.string().uuid(),
    username: z.string().min(3).max(30),
    email: z.string().email().nullish(),
    phone: z.string().max(20).nullish(),
    passwordHash: z.string().min(8).max(100),
    role: z.enum(Object.values(UserRole)),

    status: z.enum(Object.values(UserStatus)),
    failedLoginCount: z.number().int().min(0).max(5).optional(),
    lockedUntil: z.date().nullish(),
    lastLoginAt: z.date().nullish(),
    lastLoginIp: z.optional(z.string().max(100)).nullish(),
    passwordChangedAt: z.optional(z.date()).nullish(),
    createdAt: z.date(),
    updatedAt: z.optional(z.date()),
    deletedAt: z.optional(z.date()).nullish(),
});

export const UpdateUserDTOSchema = z.object({
    username: z.string().min(3).max(30),
    email: z.string().email().nullish(),
    phone: z.string().max(20).nullish(),
    role: z.enum(Object.values(UserRole)),
    status: z.enum(Object.values(UserStatus)),
    failedLoginCount: z.number().int().min(0).max(5).optional(),
    lockedUntil: z.date().nullish(),
    lastLoginAt: z.date().nullish(),
    lastLoginIp: z.optional(z.string().max(100)).nullish(),
    passwordChangedAt: z.optional(z.date()).nullish(),
    updatedAt: z.optional(z.date()),
    deletedAt: z.optional(z.date()).nullish(),
});

export type UpdateUserDTO = z.infer<typeof UpdateUserDTOSchema>;
export type UserDTO = z.infer<typeof UserDTOSchema>;
