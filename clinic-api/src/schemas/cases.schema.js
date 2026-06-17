const { z } = require('zod');

const createCaseSchema = z.object({
  student_id: z.number().int().positive(),
  nurse_notes: z.string().optional().nullable(),
  complaint: z.string().min(5),
  temperature: z.number().min(30).max(45).optional().nullable(),
  blood_pressure: z.string().optional().nullable(),
  heart_rate: z.number().min(30).max(250).optional().nullable(),
  respiratory_rate: z.number().min(10).max(60).optional().nullable(),
  severity: z.enum(['low', 'medium', 'high']).default('low'),
});

const createFindingSchema = z.object({
  notes: z.string().min(5),
});

const createMedicationSchema = z.object({
  drug_name: z.string().min(2),
  dosage: z.string().min(1),
  instructions: z.string().optional().nullable(),
});

const createLabTestSchema = z.object({
  test_name: z.string().min(3),
});

const escalateCaseSchema = z.object({
  notes: z.string().min(5).optional(),
});

module.exports = {
  createCaseSchema,
  createFindingSchema,
  createMedicationSchema,
  createLabTestSchema,
  escalateCaseSchema,
};
