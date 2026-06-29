const db = require('../config/db');

const getDashboardStats = async (req, res, next) => {
  try {
    const closedCasesQuery = db.query("SELECT count(*) FROM cases WHERE status = 'closed'");
    const openCasesQuery = db.query("SELECT count(*) FROM cases WHERE status = 'open'");
    const activeStudentsQuery = db.query("SELECT count(*) FROM students");
    const seenTodayQuery = db.query("SELECT count(*) FROM cases WHERE created_at::date = CURRENT_DATE");

    const [closedCasesRes, openCasesRes, activeStudentsRes, seenTodayRes] = await Promise.all([
      closedCasesQuery,
      openCasesQuery,
      activeStudentsQuery,
      seenTodayQuery
    ]);

    res.status(200).json({
      closedCasesCount: parseInt(closedCasesRes.rows[0].count, 10),
      openCasesCount: parseInt(openCasesRes.rows[0].count, 10),
      activeStudentsCount: parseInt(activeStudentsRes.rows[0].count, 10),
      seenTodayCount: parseInt(seenTodayRes.rows[0].count, 10)
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats
};
