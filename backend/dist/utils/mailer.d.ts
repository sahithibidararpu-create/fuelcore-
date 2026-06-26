interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}
export declare function sendEmail(options: EmailOptions): Promise<void>;
export declare function passwordResetEmail(resetUrl: string, firstName: string): string;
export declare function lowStockAlertEmail(tankName: string, currentLiters: number, stationName: string): string;
export {};
//# sourceMappingURL=mailer.d.ts.map