import type { CreatePumpInput, UpdatePumpInput } from './pumps.schemas';
export declare class PumpsService {
    getAll(query: Record<string, string | undefined>, user: {
        role: string;
        stationId: string | null;
    }): Promise<{
        success: true;
        data: ({
            station: {
                name: string;
                id: string;
            };
            _count: {
                sales: number;
            };
            tank: {
                name: string;
                id: string;
                fuelType: import(".prisma/client").$Enums.FuelType;
                capacityLiters: number;
                currentLiters: number;
            };
        } & {
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
        })[];
        meta: import("../../utils/pagination").PaginationMeta;
    }>;
    getById(id: string, stationId?: string | null): Promise<{
        station: {
            name: string;
            id: string;
        };
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
        meterReadings: {
            id: string;
            notes: string | null;
            pumpId: string;
            readingValue: number;
            recordedAt: Date;
            recordedBy: string | null;
        }[];
    } & {
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
    }>;
    create(data: CreatePumpInput, stationId: string): Promise<{
        station: {
            name: string;
            id: string;
        };
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
    }>;
    update(id: string, data: UpdatePumpInput, stationId?: string | null): Promise<{
        tank: {
            name: string;
            fuelType: import(".prisma/client").$Enums.FuelType;
        };
    } & {
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
    }>;
    delete(id: string, stationId?: string | null): Promise<{
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
    }>;
    getStatusSummary(stationId?: string | null): Promise<Record<string, number>>;
    getMeterHistory(pumpId: string, stationId?: string | null): Promise<{
        id: string;
        notes: string | null;
        pumpId: string;
        readingValue: number;
        recordedAt: Date;
        recordedBy: string | null;
    }[]>;
}
export declare const pumpsService: PumpsService;
//# sourceMappingURL=pumps.service.d.ts.map