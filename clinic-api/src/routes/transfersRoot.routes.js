const express = require('express');
const router = express.Router();
const transfersController = require('../controllers/transfers.controller');
const validate = require('../middlewares/validate');
const authorize = require('../middlewares/authorize');
const { updateTransferStatusSchema } = require('../schemas/transfers.schema');

router.get('/pending', authorize('doctor', 'admin'), transfersController.getPendingTransfers);
router.patch('/:id/status', authorize('doctor', 'admin'), validate(updateTransferStatusSchema), transfersController.updateTransferStatus);

module.exports = router;
