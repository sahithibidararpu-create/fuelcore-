export declare class FleetService {
    getAccounts(query: Record<string, string | undefined>, user: {
        role: string;
        stationId: string | null;
    }): Promise<{
        success: true;
        data: {
            availableCredit: number;
            utilizationPercent: number;
            station: {
                name: string;
            };
            _count: {
                sales: number;
                payments: number;
            };
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
        }[];
        meta: import("../../utils/pagination").PaginationMeta;
    }>;
    getAccountById(id: string, stationId?: string | null): Promise<{
        station: {
            name: string;
        };
        sales: ({
            pump: {
                pumpNumber: string;
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
        })[];
        payments: {
            amount: number;
            id: string;
            createdAt: Date;
            notes: string | null;
            fleetAccountId: string;
            paymentDate: Date;
            reference: string | null;
        }[];
    } & {
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
    }>;
    createAccount(data: Record<string, unknown>, stationId: string): Promise<{
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
    }>;
    updateAccount(id: string, data: Record<string, unknown>, stationId?: string | null): Promise<{
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
    }>;
    recordPayment(accountId: string, amount: number, reference: string, notes: string, stationId?: string | null): Promise<{
        amount: number;
        id: string;
        createdAt: Date;
        notes: string | null;
        fleetAccountId: string;
        paymentDate: Date;
        reference: string | null;
    }>;
    getTransactions(accountId: string, query: Record<string, string | undefined>, stationId?: string | null): Promise<{
        account: {
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
        };
        sales: ({
            pump: {
                pumpNumber: string;
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
        })[];
        payments: {
            amount: number;
            id: string;
            createdAt: Date;
            notes: string | null;
            fleetAccountId: string;
            paymentDate: Date;
            reference: string | null;
        }[];
    }>;
}
export declare const fleetService: FleetService;
//# sourceMappingURL=fleet.service.d.ts.map