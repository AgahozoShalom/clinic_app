const express = require('express');
const router = express.Router();
const labTestsController = require('../controllers/labTests.controller');
const validate = require('../middlewares/validate');
const authorize = require('../middlewares/authorize');
const { updateLabTestResultsSchema } = require('../schemas/labTests.schema');

router.get('/pending', authorize('lab_technician', 'admin'), labTestsController.getPendingLabTests);
router.get('/completed', authorize('lab_technician', 'admin'), labTestsController.getCompletedLabTests);
router.patch('/:id/results', authorize('lab_technician', 'admin'), validate(updateLabTestResultsSchema), labTestsController.updateLabTestResults);

module.exports = router;
