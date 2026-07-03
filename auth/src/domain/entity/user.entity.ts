

export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
    STAFF = 'STAFF',
    INVESTOR = 'INVESTOR',
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    BANNED = 'BANNED',
    DELETED = 'DELETED',
    UNVERIFIED = 'UNVERIFIED',
}

export interface UserProps {
    id: string;
    username: string;
    email: string | null;
    phone: string | null;
    passwordHash: string;
    role: UserRole;
    status: UserStatus;
    failedLoginCount?: number;
    lockedUntil?: Date | null;
    lastLoginAt?: Date | null;
    lastLoginIp?: string | null;
    passwordChangedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}

export interface UpdateUserData {
    username?: string;
    email?: string | null;
    phone?: string | null;
    passwordHash?: string;
    role?: UserRole;
    status?: UserStatus;
    failedLoginCount?: number;
    lockedUntil?: Date | null;
    lastLoginAt?: Date | null;
    lastLoginIp?: string | null;
    passwordChangedAt?: Date | null;
    deletedAt?: Date | null;
}

export interface CreateUserData {
    id?: string;
    username: string;
    email: string | null;
    phone: string | null;
    passwordHash: string;
    role?: UserRole;
    status?: UserStatus;
    failedLoginCount?: number;
    lockedUntil?: Date | null;
    lastLoginAt?: Date | null;
    lastLoginIp?: string | null;
    passwordChangedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
}

export class UserEntity {
    private readonly _id: string;
    private _username: string;
    private _email: string | null;
    private _phone: string | null;
    private _passwordHash: string;
    private _role: UserRole;
    private _status: UserStatus;
    private _failedLoginCount: number;
    private _lockedUntil: Date | null;
    private _lastLoginAt: Date | null;
    private _lastLoginIp: string | null;
    private _passwordChangedAt: Date | null;
    private readonly _createdAt: Date;
    private _updatedAt: Date;
    private _deletedAt: Date | null;

    private constructor(props: UserProps) {
        this._id = props.id;
        this._username = props.username;
        this._email = props.email;
        this._phone = props.phone;
        this._passwordHash = props.passwordHash;
        this._role = props.role;
        this._status = props.status;
        this._failedLoginCount = props.failedLoginCount ?? 0;
        this._lockedUntil = props.lockedUntil ?? null;
        this._lastLoginAt = props.lastLoginAt ?? null;
        this._lastLoginIp = props.lastLoginIp ?? null;
        this._passwordChangedAt = props.passwordChangedAt ?? null;
        this._createdAt = props.createdAt;
        this._updatedAt = props.updatedAt;
        this._deletedAt = props.deletedAt ?? null;
    }

    static create(props: UserProps): UserEntity {
        return new UserEntity(props);
    }

    static fromPersistence(props: UserProps): UserEntity {
        return new UserEntity(props);
    }

    static new(username: string, email: string | null, phone: string | null, passwordHash: string): UserEntity {
        return new UserEntity({
            id: crypto.randomUUID(),
            username,
            email,
            phone,
            passwordHash,
            role: UserRole.USER,
            status: UserStatus.UNVERIFIED,
            failedLoginCount: 0,
            lockedUntil: null,
            lastLoginAt: null,
            lastLoginIp: null,
            passwordChangedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
        });
    }

    // ============================================================
    // Business Logic Methods
    // ============================================================

    /**
     * Check if account is currently locked
     */
    isLocked(): boolean {
        if (this._lockedUntil === null) return false;
        return this._lockedUntil > new Date();
    }

    /**
     * Check if user can attempt login
     */
    canLogin(): boolean {
        // Check if account is banned
        if (this._status === UserStatus.BANNED) {
            return false;
        }

        // Check if account is deleted
        if (this._status === UserStatus.DELETED) {
            return false;
        }

        // Check if account is temporarily locked
        return !this.isLocked();
    }

    /**
     * Record failed login attempt
     */
    recordFailedLogin(maxAttempts: number = 5): void {
        this._failedLoginCount += 1;

        // Lock account if max attempts reached
        if (this._failedLoginCount >= maxAttempts) {
            this._lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        }

        this._updatedAt = new Date();
    }

    /**
     * Record successful login
     */
    recordSuccessfulLogin(ip: string): void {
        this._failedLoginCount = 0;
        this._lockedUntil = null;
        this._lastLoginAt = new Date();
        this._lastLoginIp = ip;
        this._updatedAt = new Date();
    }

    /**
     * Change user password
     */
    changePassword(newPasswordHash: string): void {
        this._passwordHash = newPasswordHash;
        this._passwordChangedAt = new Date();
        this._updatedAt = new Date();
    }

    /**
     * Ban user account
     */
    ban(): void {
        this._status = UserStatus.BANNED;
        this._updatedAt = new Date();
    }

    /**
     * Unban user account
     */
    unban(): void {
        this._status = UserStatus.ACTIVE;
        this._failedLoginCount = 0;
        this._lockedUntil = null;
        this._updatedAt = new Date();
    }

    /**
     * Mark account as verified
     */
    markAsVerified(): void {
        this._status = UserStatus.ACTIVE;
        this._updatedAt = new Date();
    }

    /**
     * Soft delete user account
     */
    softDelete(): void {
        this._status = UserStatus.DELETED;
        this._deletedAt = new Date();
        this._updatedAt = new Date();
    }

    /**
     * Update user email
     */
    updateEmail(email: string): void {
        this._email = email;
        this._updatedAt = new Date();
    }

    /**
     * Update user phone
     */
    updatePhone(phone: string): void {
        this._phone = phone;
        this._updatedAt = new Date();
    }

    /**
     * Update user role
     */
    updateRole(role: UserRole): void {
        this._role = role;
        this._updatedAt = new Date();
    }

    /**
     * Check if user has specific role
     */
    hasRole(role: UserRole): boolean {
        return this._role === role;
    }

    /**
     * Check if user has any of the specified roles
     */
    hasAnyRole(roles: UserRole[]): boolean {
        return roles.includes(this._role);
    }

    /**
     * Check if user is admin
     */
    isAdmin(): boolean {
        return this._role === UserRole.ADMIN;
    }

    /**
     * Check if user is staff
     */
    isStaff(): boolean {
        return this._role === UserRole.STAFF;
    }

    /**
     * Check if email is verified
     */
    isVerified(): boolean {
        return this._status === UserStatus.ACTIVE;
    }

    /**
     * Get public user data (without password)
     */
    toPublic(): Omit<UserProps, 'passwordHash'> {
        const { passwordHash, ...publicData } = this.toPersistence();
        return publicData;
    }

    /**
     * Convert to persistence object
     */
    toPersistence(): UserProps {
        return {
            id: this._id,
            username: this._username,
            email: this._email,
            phone: this._phone,
            passwordHash: this._passwordHash,
            role: this._role,
            status: this._status,
            failedLoginCount: this._failedLoginCount,
            lockedUntil: this._lockedUntil,
            lastLoginAt: this._lastLoginAt,
            lastLoginIp: this._lastLoginIp,
            passwordChangedAt: this._passwordChangedAt,
            createdAt: this._createdAt,
            updatedAt: this._updatedAt,
            deletedAt: this._deletedAt,
        };
    }

    // ============================================================
    // Getters
    // ============================================================

    get id(): string { return this._id; }
    get username(): string { return this._username; }
    get email(): string | null { return this._email; }
    get phone(): string | null { return this._phone; }
    get passwordHash(): string { return this._passwordHash; }
    get role(): UserRole { return this._role; }
    get status(): UserStatus { return this._status; }
    get failedLoginCount(): number { return this._failedLoginCount; }
    get lockedUntil(): Date | null { return this._lockedUntil; }
    get lastLoginAt(): Date | null { return this._lastLoginAt; }
    get lastLoginIp(): string | null { return this._lastLoginIp; }
    get passwordChangedAt(): Date | null { return this._passwordChangedAt; }
    get createdAt(): Date { return this._createdAt; }
    get updatedAt(): Date { return this._updatedAt; }
    get deletedAt(): Date | null { return this._deletedAt; }
}

// ============================================================
// Public User Type (without sensitive data)
// ============================================================

export type PublicUser = Omit<UserProps, 'passwordHash'>;
