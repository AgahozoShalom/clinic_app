const db = require('../config/db');
const { AppError } = require('../middlewares/errorHandler');

const createTransfer = async (caseId, userId, data) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const caseCheck = await client.query('SELECT status FROM cases WHERE id = $1 FOR UPDATE', [caseId]);
    if (caseCheck.rows.length === 0) {
      throw new AppError('Case not found', 404);
    }
    if (caseCheck.rows[0].status !== 'open') {
      throw new AppError('Conflict: Case is not open', 409);
    }

    const { hospital_name, reason } = data;

    const transferResult = await client.query(
      'INSERT INTO transfers (case_id, initiated_by, hospital_name, reason) VALUES ($1, $2, $3, $4) RETURNING id, case_id, hospital_name, reason, status, initiated_by, created_at',
      [caseId, userId, hospital_name, reason]
    );

    await client.query("UPDATE cases SET status = 'pending_transfer', updated_at = NOW() WHERE id = $1", [caseId]);

    await client.query('COMMIT');
    return transferResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const updateTransferStatus = async (transferId, status) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const transferCheck = await client.query('SELECT case_id, status FROM transfers WHERE id = $1 FOR UPDATE', [transferId]);
    if (transferCheck.rows.length === 0) {
      throw new AppError('Transfer not found', 404);
    }
    if (transferCheck.rows[0].status !== 'initiated') {
      throw new AppError('Conflict: Transfer is already confirmed or cancelled', 409);
    }

    const result = await client.query(
      'UPDATE transfers SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, status, updated_at',
      [status, transferId]
    );

    if (status === 'cancelled') {
      await client.query("UPDATE cases SET status = 'open', updated_at = NOW() WHERE id = $1", [transferCheck.rows[0].case_id]);
    }

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createTransfer,
  updateTransferStatus,
};
