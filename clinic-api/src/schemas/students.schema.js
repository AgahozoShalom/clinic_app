const { z } = require('zod');

const createStudentSchema = z.object({
  admission_code: z.string().min(1),
  first_name: z.string().min(1),
  middle_name: z.string().nullable().optional(),
  last_name: z.string().min(1),
  family_name: z.string().min(1),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date string" }),
  gender: z.enum(['male', 'female']),
  nationality: z.string().min(1),
  grade: z.string().min(1),
  class: z.string().min(1),
  mother_name: z.string().min(1),
  mother_email: z.string().email().nullable().optional(),
  mother_phone: z.string().min(1),
});

const updateStudentSchema = createStudentSchema.partial();

module.exports = {
  createStudentSchema,
  updateStudentSchema,
};
