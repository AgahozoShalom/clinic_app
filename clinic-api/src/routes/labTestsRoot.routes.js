const express = require('express');
const router = express.Router();
const labTestsController = require('../controllers/labTests.controller');
const validate = require('../middlewares/validate');
const authorize = require('../middlewares/authorize');
const { updateLabTestResultsSchema } = require('../schemas/labTests.schema');

router.get('/pending', authorize('lab_technician'), labTestsController.getPendingLabTests);
router.get('/completed', authorize('lab_technician'), labTestsController.getCompletedLabTests);
router.patch('/:id/results', authorize('lab_technician'), validate(updateLabTestResultsSchema), labTestsController.updateLabTestResults);

module.exports = router;
