const db = require('./src/config/db');
async function run() {
  try {
    await db.query("ALTER TYPE finding_role ADD VALUE IF NOT EXISTS 'nurse'");
    console.log('Enum altered');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
