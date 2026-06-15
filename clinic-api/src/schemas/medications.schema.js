const { z } = require('zod');

const createMedicationSchema = z.object({
  drug_name: z.string().min(1),
  dosage: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
});

module.exports = {
  createMedicationSchema,
};
