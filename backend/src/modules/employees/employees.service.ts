import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { HTTP_STATUS } from '../../config/constants';
import { parsePagination, paginatedResponse, generateEmployeeCode } from '../../utils/pagination';
import { hashPassword } from '../../utils/bcrypt';
import { parseDateRange } from '../../utils/dateHelpers';

export class EmployeesService {
  async getAll(query: Record<string, string | undefined>, user: { role: string; stationId: string | null }) {
    const { page, limit, skip } = parsePagination(query);
    const stationId = user.role === 'SUPER_ADMIN' ? query.stationId : (user.stationId ?? undefined);

    const where: Record<string, unknown> = {
      isActive: true,
      ...(stationId && { stationId }),
      ...(query.search && {
        user: {
          OR: [
            { firstName: { contains: query.search, mode: 'insensitive' } },
            { lastName: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ],
        },
      }),
    };

    const [total, data] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { user: { firstName: 'asc' } },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, avatarUrl: true, lastLoginAt: true } },
          station: { select: { id: true, name: true } },
        },
      }),
    ]);

    return paginatedResponse(data, total, page, limit);
  }

  async getById(id: string, stationId?: string | null) {
    const employee = await prisma.employee.findFirst({
      where: { id, ...(stationId && { stationId }) },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true, avatarUrl: true } },
        station: { select: { id: true, name: true } },
        shifts: { orderBy: { date: 'desc' }, take: 30 },
      },
    });
    if (!employee) throw new AppError('Employee not found', HTTP_STATUS.NOT_FOUND);
    return employee;
  }

  async createEmployee(data: Record<string, unknown>, stationId: string) {
    const actualStationId = (data.stationId as string) || stationId;
    const email = (data.email as string).toLowerCase();
    
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new AppError('Email already exists', HTTP_STATUS.CONFLICT);
    }

    const passwordHash = await hashPassword((data.password as string) || 'Temp@1234');
    const role = (data.role as any) || 'EMPLOYEE';
    const position = (data.position as string) || (role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'STATION_MANAGER' ? 'Station Manager' : 'Staff');
    const hireDate = data.hireDate ? new Date(data.hireDate as string) : new Date();

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName: data.firstName as string,
          lastName: data.lastName as string,
          phone: data.phone as string | undefined,
          role,
          stationId: actualStationId,
        },
      });

      const employee = await tx.employee.create({
        data: {
          employeeCode: generateEmployeeCode(),
          position,
          department: data.department as string | undefined,
          baseSalary: (data.baseSalary as number) || 0,
          hourlyRate: data.hourlyRate as number | undefined,
          hireDate,
          emergencyContact: data.emergencyContact as string | undefined,
          emergencyPhone: data.emergencyPhone as string | undefined,
          userId: user.id,
          stationId: actualStationId,
        },
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
          station: { select: { id: true, name: true } },
        },
      });

      return employee;
    });
  }

  async updateEmployee(id: string, data: Record<string, unknown>, stationId?: string | null) {
    const employee = await prisma.employee.findFirst({
      where: { id, ...(stationId && { stationId }) },
    });
    if (!employee) throw new AppError('Employee not found', HTTP_STATUS.NOT_FOUND);

    return prisma.employee.update({
      where: { id },
      data: {
        position: data.position as string | undefined,
        department: data.department as string | undefined,
        baseSalary: data.baseSalary as number | undefined,
        hourlyRate: data.hourlyRate as number | undefined,
        emergencyContact: data.emergencyContact as string | undefined,
        emergencyPhone: data.emergencyPhone as string | undefined,
      },
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  // ─── Attendance ──────────────────────────────────────────────────────────────
  async getAttendance(query: Record<string, string | undefined>, stationId?: string | null) {
    const { from, to } = parseDateRange(query.from, query.to);
    const { page, limit, skip } = parsePagination(query);

    const where: Record<string, unknown> = {
      date: { gte: from, lte: to },
      ...(query.userId && { userId: query.userId }),
      ...(stationId && { user: { stationId } }),
    };

    const [total, data] = await Promise.all([
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
    ]);

    return paginatedResponse(data, total, page, limit);
  }

  async checkIn(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
      where: { userId, date: today },
    });

    if (existing?.checkIn) {
      throw new AppError('Already checked in today', HTTP_STATUS.CONFLICT);
    }

    return prisma.attendance.upsert({
      where: { userId_date: { userId, date: today } },
      create: { userId, date: today, checkIn: new Date(), status: 'PRESENT' },
      update: { checkIn: new Date(), status: 'PRESENT' },
    });
  }

  async checkOut(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await prisma.attendance.findFirst({
      where: { userId, date: today },
    });

    if (!record || !record.checkIn) {
      throw new AppError('No check-in found for today', HTTP_STATUS.BAD_REQUEST);
    }
    if (record.checkOut) {
      throw new AppError('Already checked out today', HTTP_STATUS.CONFLICT);
    }

    const checkOut = new Date();
    const hoursWorked = (checkOut.getTime() - record.checkIn.getTime()) / (1000 * 60 * 60);

    return prisma.attendance.update({
      where: { id: record.id },
      data: { checkOut, hoursWorked: Math.round(hoursWorked * 100) / 100 },
    });
  }

  async getPayrollSummary(employeeId: string, stationId?: string | null) {
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, ...(stationId && { stationId }) },
      include: { user: { select: { firstName: true, lastName: true } } },
    });
    if (!employee) throw new AppError('Employee not found', HTTP_STATUS.NOT_FOUND);

    const thisMonth = new Date();
    const from = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
    const to = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0, 23, 59, 59);

    const attendance = await prisma.attendance.findMany({
      where: { userId: employee.userId, date: { gte: from, lte: to } },
    });

    const daysWorked = attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const totalHours = attendance.reduce((sum, a) => sum + (a.hoursWorked ?? 0), 0);

    return {
      employee: {
        id: employee.id,
        name: `${employee.user.firstName} ${employee.user.lastName}`,
        position: employee.position,
        baseSalary: employee.baseSalary,
        hourlyRate: employee.hourlyRate,
      },
      period: { from, to },
      attendance: { daysWorked, totalHours, records: attendance.length },
      estimatedPay: employee.hourlyRate
        ? totalHours * employee.hourlyRate
        : (daysWorked / 22) * employee.baseSalary,
    };
  }
}

export const employeesService = new EmployeesService();
