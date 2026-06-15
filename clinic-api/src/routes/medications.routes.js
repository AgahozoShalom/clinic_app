const express = require('express');
const router = express.Router({ mergeParams: true });
const medicationsController = require('../controllers/medications.controller');
const validate = require('../middlewares/validate');
const authorize = require('../middlewares/authorize');
const { createMedicationSchema } = require('../schemas/medications.schema');

router.post('/', authorize('nurse', 'doctor'), validate(createMedicationSchema), medicationsController.createMedication);
router.get('/', authorize('nurse', 'doctor', 'lab_technician', 'admin'), medicationsController.getMedications);

module.exports = router;
