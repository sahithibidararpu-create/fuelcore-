export declare class ExpensesService {
    getAll(query: Record<string, string | undefined>, user: {
        role: string;
        stationId: string | null;
    }): Promise<{
        success: true;
        data: ({
            station: {
                name: string;
            };
        } & {
            amount: number;
            stationId: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            title: string;
            expenseDate: Date;
            category: import(".prisma/client").$Enums.ExpenseCategory;
            receiptUrl: string | null;
            isApproved: boolean;
            approvedBy: string | null;
        })[];
        meta: import("../../utils/pagination").PaginationMeta;
    }>;
    getById(id: string, stationId?: string | null): Promise<{
        station: {
            name: string;
        };
    } & {
        amount: number;
        stationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        expenseDate: Date;
        category: import(".prisma/client").$Enums.ExpenseCategory;
        receiptUrl: string | null;
        isApproved: boolean;
        approvedBy: string | null;
    }>;
    create(data: Record<string, unknown>, stationId: string): Promise<{
        amount: number;
        stationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        expenseDate: Date;
        category: import(".prisma/client").$Enums.ExpenseCategory;
        receiptUrl: string | null;
        isApproved: boolean;
        approvedBy: string | null;
    }>;
    update(id: string, data: Record<string, unknown>, stationId?: string | null): Promise<{
        amount: number;
        stationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        expenseDate: Date;
        category: import(".prisma/client").$Enums.ExpenseCategory;
        receiptUrl: string | null;
        isApproved: boolean;
        approvedBy: string | null;
    }>;
    delete(id: string, stationId?: string | null): Promise<{
        amount: number;
        stationId: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        expenseDate: Date;
        category: import(".prisma/client").$Enums.ExpenseCategory;
        receiptUrl: string | null;
        isApproved: boolean;
        approvedBy: string | null;
    }>;
    getSummary(stationId?: string | null, from?: string, to?: string): Promise<{
        totalAmount: number;
        totalCount: number;
        byCategory: {
            category: import(".prisma/client").$Enums.ExpenseCategory;
            amount: number;
            count: number;
        }[];
    }>;
}
export declare const expensesService: ExpensesService;
//# sourceMappingURL=expenses.service.d.ts.map