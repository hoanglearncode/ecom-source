/**
 * OAuth Use Case Implementation
 * TODO: Implement full OAuth logic
 */

import { injectable, inject } from 'inversify';
import { VerifyEmailDto, ResendVerificationDto } from '@/application/dto/verify-email.dto.js';
import {
    VerifyUseCaseInterface,
    VerifyType,
    VerifyMethod,
    type VerificationStatus,
} from '@/application/interface/verify.use-case.interface.js';
import { TYPES } from '@/di/type.js';
import { IUserVerifyRepository } from '@/domain/reponsitory-interface/user-verify.reponsitory.interface.js';
import { IUserRepository } from '@/domain/reponsitory-interface/user.reponsitory.interface.js';
import { INotificationService } from '@/domain/service-interface/notification.interface.js';
import { IPasswordHasher } from '@/domain/service-interface/password-hasher.interface.js';
import { TwoFactorEntity } from '@/domain/entity/twoFactor.entity.js';
import { VerificationError, UserError } from '@/domain/domain-error/error.js';
import { logger } from '@/shared/logger/index.js';
import { VERIFY_TYPE as PrismaVerifyType } from '@/generated/prisma/enums.js';
import { OAuthUseCaseInterface } from '@/application/interface/index.js';

@injectable()
export class OAuthUseCase {
    constructor(
        @inject(TYPES.UserVerifyRepository) private userVerifyRepository: IUserVerifyRepository,
        @inject(TYPES.UserRepository) private userRepository: IUserRepository,
        @inject(TYPES.NotificationService) private notificationService: INotificationService,
        @inject(TYPES.PasswordHasher) private passwordHasher: IPasswordHasher,
    ) {}

}
