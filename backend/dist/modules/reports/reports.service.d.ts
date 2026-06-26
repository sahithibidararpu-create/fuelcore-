export declare class ReportsService {
    private getSalesAggregate;
    getDaily(stationId?: string | null, date?: string): Promise<{
        date: string;
        revenue: number;
        volume: number;
        transactions: number;
        expenses: number;
        netProfit: number;
        byFuelType: {
            fuelType: import(".prisma/client").$Enums.FuelType;
            volume: number;
            revenue: number;
            transactions: number;
        }[];
        byPaymentMethod: {
            method: import(".prisma/client").$Enums.SalePaymentMethod;
            revenue: number;
            transactions: number;
        }[];
        byPump: {
            pump: string;
            label: string;
            volume: number;
            revenue: number;
        }[];
    }>;
    getWeekly(stationId?: string | null): Promise<{
        from: string;
        to: string;
        days: {
            date: string;
            revenue: number;
            volume: number;
            transactions: number;
        }[];
        totals: {
            revenue: number;
            volume: number;
            transactions: number;
        };
    }>;
    getMonthly(stationId?: string | null, year?: number, month?: number): Promise<{
        year: number;
        month: number;
        revenue: number;
        volume: number;
        transactions: number;
        expenses: number;
        netProfit: number;
        weeklyBreakdown: {
            week: number;
            revenue: number;
            volume: number;
            transactions: number;
        }[];
    }>;
    getInventoryReport(stationId?: string | null): Promise<{
        id: string;
        name: string;
        fuelType: import(".prisma/client").$Enums.FuelType;
        capacityLiters: number;
        currentLiters: number;
        percentFull: number;
        isLow: boolean;
        stationName: string;
        lastRefills: ({
            supplier: {
                name: string;
            };
        } & {
            stationId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            volumeLiters: number;
            pricePerLiter: number;
            invoiceNumber: string | null;
            notes: string | null;
            tankId: string;
            deliveryDate: Date;
            supplierId: string;
            totalCost: number;
        })[];
    }[]>;
}
export declare const reportsService: ReportsService;
//# sourceMappingURL=reports.service.d.ts.map