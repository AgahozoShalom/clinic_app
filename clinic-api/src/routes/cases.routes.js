const express = require('express');
const router = express.Router();
const casesController = require('../controllers/cases.controller');
const validate = require('../middlewares/validate');
const authorize = require('../middlewares/authorize');
const { createCaseSchema } = require('../schemas/cases.schema');

router.post('/', authorize('nurse'), validate(createCaseSchema), casesController.createCase);
router.get('/', authorize('nurse', 'doctor', 'lab_technician', 'admin'), casesController.getCases);
router.get('/queue/open', authorize('nurse'), casesController.getOpenQueue);
router.get('/:id', authorize('nurse', 'doctor', 'lab_technician', 'admin'), casesController.getCaseById);
router.patch('/:id/close', authorize('nurse', 'doctor'), casesController.closeCase);

module.exports = router;
