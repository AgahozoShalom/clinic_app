const { z } = require('zod');

const createTransferSchema = z.object({
  hospital_name: z.string().min(1),
  reason: z.string().optional().nullable(),
});

const updateTransferStatusSchema = z.object({
  status: z.enum(['confirmed', 'cancelled']),
});

module.exports = {
  createTransferSchema,
  updateTransferStatusSchema,
};
