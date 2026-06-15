const express = require('express');
const router = express.Router({ mergeParams: true });
const transfersController = require('../controllers/transfers.controller');
const validate = require('../middlewares/validate');
const authorize = require('../middlewares/authorize');
const { createTransferSchema } = require('../schemas/transfers.schema');

router.post('/', authorize('doctor'), validate(createTransferSchema), transfersController.createTransfer);

module.exports = router;
