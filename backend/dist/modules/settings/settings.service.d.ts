export declare class SettingsService {
    getStationSettings(stationId: string): Promise<{
        station: {
            name: string;
            email: string | null;
            phone: string | null;
            id: string;
            address: string;
            city: string;
            state: string;
            logoUrl: string | null;
        };
    } & {
        stationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        dieselPrice: number;
        petrolPrice: number;
        premiumPrice: number;
        kerosenePrice: number;
        lowStockThreshold: number;
        criticalStockThreshold: number;
        enableEmailNotifications: boolean;
        enableLowStockAlerts: boolean;
        enableFleetAlerts: boolean;
        workingHoursStart: string;
        workingHoursEnd: string;
    }>;
    updateStationSettings(stationId: string, data: Record<string, unknown>): Promise<{
        stationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        dieselPrice: number;
        petrolPrice: number;
        premiumPrice: number;
        kerosenePrice: number;
        lowStockThreshold: number;
        criticalStockThreshold: number;
        enableEmailNotifications: boolean;
        enableLowStockAlerts: boolean;
        enableFleetAlerts: boolean;
        workingHoursStart: string;
        workingHoursEnd: string;
    }>;
    updateStationProfile(stationId: string, data: Record<string, unknown>): Promise<{
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
    }>;
    getFuelPrices(stationId: string): Promise<{
        DIESEL: number;
        PETROL: number;
        PREMIUM: number;
        KEROSENE: number;
    }>;
    updateFuelPrices(stationId: string, prices: Record<string, number>): Promise<{
        stationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        dieselPrice: number;
        petrolPrice: number;
        premiumPrice: number;
        kerosenePrice: number;
        lowStockThreshold: number;
        criticalStockThreshold: number;
        enableEmailNotifications: boolean;
        enableLowStockAlerts: boolean;
        enableFleetAlerts: boolean;
        workingHoursStart: string;
        workingHoursEnd: string;
    }>;
    getAllStations(): Promise<({
        _count: {
            employees: number;
            tanks: number;
            pumps: number;
        };
        settings: {
            stationId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            dieselPrice: number;
            petrolPrice: number;
            premiumPrice: number;
            kerosenePrice: number;
            lowStockThreshold: number;
            criticalStockThreshold: number;
            enableEmailNotifications: boolean;
            enableLowStockAlerts: boolean;
            enableFleetAlerts: boolean;
            workingHoursStart: string;
            workingHoursEnd: string;
        } | null;
    } & {
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
    })[]>;
    createStation(data: Record<string, unknown>): Promise<{
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
    }>;
}
export declare const settingsService: SettingsService;
//# sourceMappingURL=settings.service.d.ts.map