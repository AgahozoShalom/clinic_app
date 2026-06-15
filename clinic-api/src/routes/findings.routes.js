const express = require('express');
const router = express.Router({ mergeParams: true });
const findingsController = require('../controllers/findings.controller');
const validate = require('../middlewares/validate');
const authorize = require('../middlewares/authorize');
const { createFindingSchema } = require('../schemas/cases.schema');

router.post('/', authorize('doctor', 'lab_technician'), validate(createFindingSchema), findingsController.createFinding);
router.get('/', authorize('nurse', 'doctor', 'lab_technician', 'admin'), findingsController.getFindings);

module.exports = router;
