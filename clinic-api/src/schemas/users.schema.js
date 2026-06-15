const { z } = require('zod');

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['nurse', 'doctor', 'lab_technician', 'admin']),
  phone: z.string().optional().nullable(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(['nurse', 'doctor', 'lab_technician', 'admin']).optional(),
  password: z.string().min(6).optional(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
};
