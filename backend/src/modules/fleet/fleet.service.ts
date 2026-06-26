import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { HTTP_STATUS } from '../../config/constants';
import { parsePagination, paginatedResponse, generateAccountNumber } from '../../utils/pagination';
import { CONSTANTS } from '../../config/constants';

export class FleetService {
  async getAccounts(query: Record<string, string | undefined>, user: { role: string; stationId: string | null }) {
    const { page, limit, skip } = parsePagination(query);
    const stationId = user.role === 'SUPER_ADMIN' ? query.stationId : (user.stationId ?? undefined);

    const where: Record<string, unknown> = {
      isActive: true,
      ...(stationId && { stationId }),
      ...(query.search && {
        OR: [
          { companyName: { contains: query.search, mode: 'insensitive' } },
          { accountNumber: { contains: query.search, mode: 'insensitive' } },
          { contactName: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      prisma.fleetAccount.count({ where }),
      prisma.fleetAccount.findMany({
        where,
        skip,
        take: limit,
        orderBy: { companyName: 'asc' },
        include: {
          station: { select: { name: true } },
          _count: { select: { sales: true, payments: true } },
        },
      }),
    ]);

    const enriched = data.map((a) => ({
      ...a,
      availableCredit: a.creditLimit - a.currentBalance,
      utilizationPercent: Math.round((a.currentBalance / a.creditLimit) * 100),
    }));

    return paginatedResponse(enriched, total, page, limit);
  }

  async getAccountById(id: string, stationId?: string | null) {
    const account = await prisma.fleetAccount.findFirst({
      where: { id, ...(stationId && { stationId }) },
      include: {
        station: { select: { name: true } },
        sales: {
          where: { isVoided: false },
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { tank: { select: { fuelType: true } }, pump: { select: { pumpNumber: true } } },
        },
        payments: { orderBy: { paymentDate: 'desc' }, take: 10 },
      },
    });
    if (!account) throw new AppError('Fleet account not found', HTTP_STATUS.NOT_FOUND);
    return account;
  }

  async createAccount(data: Record<string, unknown>, stationId: string) {
    return prisma.fleetAccount.create({
      data: {
        accountNumber: generateAccountNumber(CONSTANTS.FLEET_ACCOUNT_PREFIX),
        companyName: data.companyName as string,
        contactName: data.contactName as string | undefined,
        contactPhone: data.contactPhone as string | undefined,
        contactEmail: data.contactEmail as string | undefined,
        creditLimit: (data.creditLimit as number) || 50000,
        notes: data.notes as string | undefined,
        stationId: (data.stationId as string) || stationId,
      },
    });
  }

  async updateAccount(id: string, data: Record<string, unknown>, stationId?: string | null) {
    const account = await prisma.fleetAccount.findFirst({ where: { id, ...(stationId && { stationId }) } });
    if (!account) throw new AppError('Fleet account not found', HTTP_STATUS.NOT_FOUND);
    return prisma.fleetAccount.update({ where: { id }, data });
  }

  async recordPayment(accountId: string, amount: number, reference: string, notes: string, stationId?: string | null) {
    const account = await prisma.fleetAccount.findFirst({
      where: { id: accountId, ...(stationId && { stationId }) },
    });
    if (!account) throw new AppError('Fleet account not found', HTTP_STATUS.NOT_FOUND);
    if (amount > account.currentBalance) {
      throw new AppError(
        `Payment amount exceeds outstanding balance: ${account.currentBalance.toFixed(2)}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    return prisma.$transaction(async (tx) => {
      const payment = await tx.fleetPayment.create({
        data: { fleetAccountId: accountId, amount, reference, notes },
      });
      await tx.fleetAccount.update({
        where: { id: accountId },
        data: { currentBalance: { decrement: amount } },
      });
      return payment;
    });
  }

  async getTransactions(accountId: string, query: Record<string, string | undefined>, stationId?: string | null) {
    const account = await prisma.fleetAccount.findFirst({
      where: { id: accountId, ...(stationId && { stationId }) },
    });
    if (!account) throw new AppError('Fleet account not found', HTTP_STATUS.NOT_FOUND);

    const { page, limit, skip } = parsePagination(query);
    const [sales, payments] = await Promise.all([
      prisma.sale.findMany({
        where: { fleetAccountId: accountId, isVoided: false },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { tank: { select: { fuelType: true } }, pump: { select: { pumpNumber: true } } },
      }),
      prisma.fleetPayment.findMany({
        where: { fleetAccountId: accountId },
        orderBy: { paymentDate: 'desc' },
      }),
    ]);

    return { account, sales, payments };
  }
}

export const fleetService = new FleetService();
