const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const validate = require('../middlewares/validate');
const authorize = require('../middlewares/authorize');
const { createUserSchema, updateUserSchema } = require('../schemas/users.schema');

router.use(authorize('admin'));

router.get('/', usersController.getUsers);
router.post('/', validate(createUserSchema), usersController.createUser);
router.patch('/:id', validate(updateUserSchema), usersController.updateUser);
router.patch('/:id/deactivate', usersController.deactivateUser);

module.exports = router;
