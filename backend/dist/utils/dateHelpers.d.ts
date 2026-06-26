export declare function formatCurrency(amount: number, symbol?: string, locale?: string): string;
export declare function formatDate(date: Date | string, fmt?: string): string;
export declare function getTodayRange(): {
    from: Date;
    to: Date;
};
export declare function getWeekRange(): {
    from: Date;
    to: Date;
};
export declare function getMonthRange(): {
    from: Date;
    to: Date;
};
export declare function getLastNDaysRange(n: number): {
    from: Date;
    to: Date;
};
export declare function parseDateRange(from?: string, to?: string): {
    from: Date;
    to: Date;
};
//# sourceMappingURL=dateHelpers.d.ts.map