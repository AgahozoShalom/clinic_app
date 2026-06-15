const express = require('express');
const router = express.Router();
const studentsController = require('../controllers/students.controller');
const validate = require('../middlewares/validate');
const authorize = require('../middlewares/authorize');
const { createStudentSchema, updateStudentSchema } = require('../schemas/students.schema');

router.use(authorize('nurse', 'doctor', 'admin'));

router.get('/', studentsController.getStudents);
router.get('/:id', studentsController.getStudentById);

router.post('/', authorize('admin'), validate(createStudentSchema), studentsController.createStudent);
router.patch('/:id', authorize('admin'), validate(updateStudentSchema), studentsController.updateStudent);

module.exports = router;
