import { z } from 'zod';

export const createSaleSchema = z.object({
  pumpId: z.string().uuid(),
  volumeLiters: z.number().positive('Volume must be positive'),
  pricePerLiter: z.number().positive('Price must be positive'),
  paymentMethod: z.enum(['CASH', 'CARD', 'FLEET', 'MOBILE']).default('CASH'),
  customerName: z.string().max(100).optional(),
  customerPhone: z.string().max(20).optional(),
  vehicleNumber: z.string().max(20).optional(),
  fleetAccountId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

export const saleQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  pumpId: z.string().optional(),
  fuelType: z.enum(['DIESEL', 'PETROL', 'PREMIUM', 'KEROSENE']).optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'FLEET', 'MOBILE']).optional(),
  stationId: z.string().optional(),
  search: z.string().optional(),
});

export const voidSaleSchema = z.object({
  voidReason: z.string().min(5, 'Void reason is required'),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type SaleQueryInput = z.infer<typeof saleQuerySchema>;
export type VoidSaleInput = z.infer<typeof voidSaleSchema>;
