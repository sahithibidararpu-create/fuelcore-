export declare class DashboardService {
    getStats(stationId?: string | null): Promise<{
        todayRevenue: number;
        todayVolume: number;
        todayTransactions: number;
        revenueChange: number;
        activePumps: number;
        totalPumps: number;
        lowStockTanks: number;
        totalTanks: number;
    }>;
    getCharts(stationId?: string | null, days?: number): Promise<{
        revenue: number;
        volume: number;
        transactions: number;
        date: string;
    }[]>;
    getRecentSales(stationId?: string | null, limit?: number): Promise<({
        station: {
            name: string;
        };
        pump: {
            pumpNumber: string;
            label: string;
        };
        employee: {
            firstName: string;
            lastName: string;
        };
        tank: {
            fuelType: import(".prisma/client").$Enums.FuelType;
        };
    } & {
        stationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isVoided: boolean;
        totalAmount: number;
        volumeLiters: number;
        pricePerLiter: number;
        invoiceNumber: string;
        paymentMethod: import(".prisma/client").$Enums.SalePaymentMethod;
        customerName: string | null;
        customerPhone: string | null;
        vehicleNumber: string | null;
        notes: string | null;
        voidReason: string | null;
        pumpId: string;
        tankId: string;
        employeeId: string;
        fleetAccountId: string | null;
    })[]>;
    getAlerts(stationId?: string | null): Promise<{
        lowStockTanks: {
            id: string;
            name: string;
            fuelType: import(".prisma/client").$Enums.FuelType;
            currentLiters: number;
            minThreshold: number;
            stationName: string;
            severity: string;
        }[];
        maintenancePumps: {
            station: {
                name: string;
            };
            id: string;
            pumpNumber: string;
            label: string;
        }[];
        lowCreditFleets: {
            id: string;
            companyName: string;
            usedPercent: number;
            available: number;
        }[];
    }>;
}
export declare const dashboardService: DashboardService;
//# sourceMappingURL=dashboard.service.d.ts.map