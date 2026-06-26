import { z } from 'zod';

export const createPumpSchema = z.object({
  pumpNumber: z.string().min(1).max(10),
  label: z.string().min(1).max(50),
  tankId: z.string().uuid(),
  stationId: z.string().uuid().optional(),
  openingMeter: z.number().nonnegative().default(0),
});

export const updatePumpSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  tankId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
  lastServiced: z.string().datetime().optional(),
});

export const pumpQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  stationId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE']).optional(),
  search: z.string().optional(),
});

export type CreatePumpInput = z.infer<typeof createPumpSchema>;
export type UpdatePumpInput = z.infer<typeof updatePumpSchema>;
