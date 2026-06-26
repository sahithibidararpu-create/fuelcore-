import type { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput, ChangePasswordInput } from './auth.schemas';
export declare class AuthService {
    login(data: LoginInput): Promise<{
        user: {
            email: string;
            firstName: string;
            lastName: string;
            role: import(".prisma/client").$Enums.Role;
            stationId: string | null;
            id: string;
            avatarUrl: string | null;
            isActive: boolean;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    register(data: RegisterInput, createdBy: string): Promise<{
        email: string;
        firstName: string;
        lastName: string;
        role: import(".prisma/client").$Enums.Role;
        stationId: string | null;
        id: string;
        createdAt: Date;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(accessToken: string, refreshToken?: string): Promise<void>;
    forgotPassword(data: ForgotPasswordInput): Promise<void>;
    resetPassword(data: ResetPasswordInput): Promise<void>;
    changePassword(userId: string, data: ChangePasswordInput): Promise<void>;
    getMe(userId: string): Promise<{
        station: {
            name: string;
            id: string;
            city: string;
        } | null;
        employee: {
            employeeCode: string;
            position: string;
            department: string | null;
        } | null;
        email: string;
        firstName: string;
        lastName: string;
        phone: string | null;
        role: import(".prisma/client").$Enums.Role;
        id: string;
        avatarUrl: string | null;
        lastLoginAt: Date | null;
        createdAt: Date;
    }>;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.service.d.ts.map