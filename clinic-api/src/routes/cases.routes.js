const express = require('express');
const router = express.Router();
const casesController = require('../controllers/cases.controller');
const validate = require('../middlewares/validate');
const authorize = require('../middlewares/authorize');
const { createCaseSchema, createFindingSchema, createMedicationSchema, createLabTestSchema, escalateCaseSchema } = require('../schemas/cases.schema');

router.post('/', authorize('nurse'), validate(createCaseSchema), casesController.createCase);
router.get('/', authorize('nurse', 'doctor', 'lab_technician', 'admin'), casesController.getCases);
router.get('/stats/dashboard', authorize('nurse', 'doctor', 'admin'), casesController.getDashboardStats);
router.get('/queue/open', authorize('nurse'), casesController.getOpenQueue);
router.get('/:id', authorize('nurse', 'doctor', 'lab_technician', 'admin'), casesController.getCaseById);
router.patch('/:id/close', authorize('nurse', 'doctor'), casesController.closeCase);

router.post('/:id/findings', authorize('nurse', 'doctor', 'lab_technician'), validate(createFindingSchema), casesController.addFindings);
router.post('/:id/medications', authorize('nurse', 'doctor'), validate(createMedicationSchema), casesController.addMedication);
router.post('/:id/lab-tests', authorize('nurse', 'doctor'), validate(createLabTestSchema), casesController.addLabTest);
router.post('/:id/escalate', authorize('nurse'), validate(escalateCaseSchema), casesController.escalateCase);
router.patch('/:id/follow-up', authorize('nurse', 'doctor'), casesController.toggleFollowUp);

module.exports = router;
