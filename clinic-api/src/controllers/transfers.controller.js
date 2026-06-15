const transfersService = require('../services/transfers.service');
const db = require('../config/db');

const createTransfer = async (req, res, next) => {
  try {
    const { id: case_id } = req.params;
    const result = await transfersService.createTransfer(case_id, req.user.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const updateTransferStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await transfersService.updateTransferStatus(id, status);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

const getPendingTransfers = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM v_pending_transfers ORDER BY transfer_initiated_at ASC');
    res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTransfer,
  updateTransferStatus,
  getPendingTransfers,
};
