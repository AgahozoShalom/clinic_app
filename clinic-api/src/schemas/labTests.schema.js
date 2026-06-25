const { z } = require('zod');

const createLabTestSchema = z.object({
  test_names: z.array(z.string().min(1)).min(1),
  notes: z.string().optional().nullable(),
});

const updateLabTestResultsSchema = z.object({
  results: z.string().min(1),
});

module.exports = {
  createLabTestSchema,
  updateLabTestResultsSchema,
};
