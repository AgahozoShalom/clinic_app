const { z } = require('zod');

const createLabTestSchema = z.object({
  test_name: z.string().min(1),
});

const updateLabTestResultsSchema = z.object({
  results: z.string().min(1),
});

module.exports = {
  createLabTestSchema,
  updateLabTestResultsSchema,
};
