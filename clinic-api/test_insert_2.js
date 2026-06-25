const db = require('./src/config/db');

async function testInsert() {
  const client = await db.pool.connect();
  try {
    const case_id = 1;
    const test_names = ['Full Blood Count (FBC)'];
    const notes = 'Test notes';
    const reqUserId = 2; // Assuming nurse

    await client.query('BEGIN');

    for (const test_name of test_names) {
      console.log('Inserting test_name:', test_name);
      const result = await client.query(
        'INSERT INTO lab_tests (case_id, requested_by, test_name, status, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id, case_id, test_name, status, notes, requested_by, requested_at',
        [case_id, reqUserId, test_name, 'requested', notes || null]
      );
      console.log('Result:', result.rows[0]);
    }

    await client.query('ROLLBACK');
    console.log('Success, rolled back for test.');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during insert:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

testInsert();
