const { z } = require('zod');

const createCaseSchema = z.object({
  student_id: z.number().int().positive(),
  nurse_notes: z.string().optional().nullable(),
});

const createFindingSchema = z.object({
  findings: z.string().min(1),
});

module.exports = {
  createCaseSchema,
  createFindingSchema,
};
