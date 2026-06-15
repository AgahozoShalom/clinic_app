const express = require('express');
const router = express.Router({ mergeParams: true });
const labTestsController = require('../controllers/labTests.controller');
const validate = require('../middlewares/validate');
const authorize = require('../middlewares/authorize');
const { createLabTestSchema } = require('../schemas/labTests.schema');

// Routes mounted at /cases/:id/lab-tests
router.post('/', authorize('nurse', 'doctor'), validate(createLabTestSchema), labTestsController.createLabTest);
router.get('/', authorize('nurse', 'doctor', 'lab_technician', 'admin'), labTestsController.getLabTestsForCase);

module.exports = router;
