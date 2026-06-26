export declare function hashPassword(password: string): Promise<string>;
export declare function comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
export declare function validatePasswordStrength(password: string): {
    valid: boolean;
    message?: string;
};
//# sourceMappingURL=bcrypt.d.ts.map