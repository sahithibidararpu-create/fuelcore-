import type { CreateSaleInput, SaleQueryInput, VoidSaleInput } from './sales.schemas';
export declare class SalesService {
    createSale(data: CreateSaleInput, employeeId: string, stationId: string): Promise<{
        pump: {
            pumpNumber: string;
            label: string;
        };
        employee: {
            firstName: string;
            lastName: string;
        };
        fleetAccount: {
            accountNumber: string;
            companyName: string;
        } | null;
        tank: {
            name: string;
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
    }>;
    getSales(query: SaleQueryInput, user: {
        role: string;
        stationId: string | null;
    }): Promise<{
        success: true;
        data: ({
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
            fleetAccount: {
                accountNumber: string;
                companyName: string;
            } | null;
            tank: {
                name: string;
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
        })[];
        meta: import("../../utils/pagination").PaginationMeta;
    }>;
    getSaleById(id: string, stationId?: string | null): Promise<{
        station: {
            name: string;
            email: string | null;
            phone: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            address: string;
            city: string;
            state: string;
            country: string;
            logoUrl: string | null;
            timezone: string;
            currency: string;
        };
        pump: {
            status: import(".prisma/client").$Enums.PumpStatus;
            stationId: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            tankId: string;
            pumpNumber: string;
            label: string;
            currentMeter: number;
            openingMeter: number;
            lastServiced: Date | null;
        };
        employee: {
            email: string;
            firstName: string;
            lastName: string;
        };
        fleetAccount: {
            stationId: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            accountNumber: string;
            companyName: string;
            contactName: string | null;
            contactPhone: string | null;
            contactEmail: string | null;
            creditLimit: number;
            currentBalance: number;
        } | null;
        tank: {
            name: string;
            stationId: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            fuelType: import(".prisma/client").$Enums.FuelType;
            capacityLiters: number;
            currentLiters: number;
            minThreshold: number;
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
    }>;
    voidSale(id: string, data: VoidSaleInput, userId: string, stationId?: string | null): Promise<{
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
    }>;
    getDailySummary(stationId: string): Promise<{
        totalRevenue: number;
        totalVolume: number;
        totalTransactions: number;
    }>;
}
export declare const salesService: SalesService;
//# sourceMappingURL=sales.service.d.ts.map