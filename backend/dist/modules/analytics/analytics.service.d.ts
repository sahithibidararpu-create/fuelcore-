export declare class AnalyticsService {
    getRevenueTrends(stationId?: string | null, days?: number): Promise<object[]>;
    getFuelMix(stationId?: string | null, days?: number): Promise<{
        volume: number;
        revenue: number;
        transactions: number;
        fuelType: string;
    }[]>;
    getDemandForecast(stationId?: string | null): Promise<{
        movingAvg: number;
        date: string;
        volume: number;
    }[]>;
    getPeakHours(stationId?: string | null): Promise<{
        day: string;
        hours: {
            hour: number;
            transactions: number;
            revenue: number;
        }[];
    }[]>;
    getRecommendations(stationId?: string | null): Promise<{
        type: string;
        title: string;
        description: string;
        priority: string;
    }[]>;
}
export declare const analyticsService: AnalyticsService;
//# sourceMappingURL=analytics.service.d.ts.map