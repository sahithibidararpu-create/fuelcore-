export declare class InventoryService {
    getTanks(query: Record<string, string | undefined>, user: {
        role: string;
        stationId: string | null;
    }): Promise<{
        success: true;
        data: {
            percentFull: number;
            isLow: boolean;
            isCritical: boolean;
            station: {
                name: string;
                id: string;
            };
            _count: {
                pumps: number;
            };
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
        }[];
        meta: import("../../utils/pagination").PaginationMeta;
    }>;
    getTankById(id: string, stationId?: string | null): Promise<{
        station: {
            name: string;
            id: string;
        };
        pumps: {
            status: import(".prisma/client").$Enums.PumpStatus;
            id: string;
            pumpNumber: string;
            label: string;
        }[];
        refills: ({
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
    } & {
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
    }>;
    createTank(data: Record<string, unknown>, stationId: string): Promise<{
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
    }>;
    updateTank(id: string, data: Record<string, unknown>, stationId?: string | null): Promise<{
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
    }>;
    getSummary(stationId?: string | null): Promise<{
        totalTanks: number;
        lowStockCount: number;
        byFuelType: Record<string, {
            capacity: number;
            current: number;
            tanks: number;
        }>;
        tanks: {
            id: string;
            name: string;
            fuelType: import(".prisma/client").$Enums.FuelType;
            currentLiters: number;
            capacityLiters: number;
            percentFull: number;
            stationName: string;
        }[];
    }>;
    getRefills(query: Record<string, string | undefined>, user: {
        role: string;
        stationId: string | null;
    }): Promise<{
        success: true;
        data: ({
            station: {
                name: string;
            };
            supplier: {
                name: string;
            };
            tank: {
                name: string;
                fuelType: import(".prisma/client").$Enums.FuelType;
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
        meta: import("../../utils/pagination").PaginationMeta;
    }>;
    createRefill(data: Record<string, unknown>, stationId: string): Promise<{
        supplier: {
            name: string;
        };
        tank: {
            name: string;
            fuelType: import(".prisma/client").$Enums.FuelType;
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
    }>;
    getSuppliers(query: Record<string, string | undefined>): Promise<{
        success: true;
        data: {
            name: string;
            email: string | null;
            phone: string | null;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            address: string | null;
            contactName: string | null;
        }[];
        meta: import("../../utils/pagination").PaginationMeta;
    }>;
    createSupplier(data: Record<string, unknown>): Promise<{
        name: string;
        email: string | null;
        phone: string | null;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        contactName: string | null;
    }>;
    updateSupplier(id: string, data: Record<string, unknown>): Promise<{
        name: string;
        email: string | null;
        phone: string | null;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        address: string | null;
        contactName: string | null;
    }>;
}
export declare const inventoryService: InventoryService;
//# sourceMappingURL=inventory.service.d.ts.map