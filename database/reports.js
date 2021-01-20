const pool = require('./pool');

const getReportsBySurvey = async (survey_id) => {
  const results = 
    await pool.query(`
      SELECT 
        *,
        (SELECT name FROM users WHERE reports.user_id=users.id) as username
      FROM
        reports 
      WHERE 
        survey_id=$1
      ORDER BY
        id DESC
    `, [survey_id]);

    if (results.rows && results.rows.length > 0)
      return results.rows;
    else
      return [];
}

const getResultDatesBySurvey = async (survey_id) => {
  const results = 
    await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') AS created_at
      FROM
        results 
      WHERE 
        survey_id=$1
      ORDER BY
        id DESC
    `, [survey_id]);

    if (results.rows && results.rows.length > 0)
      return results.rows;
    else
      return [];
}

const createReport = async (name, survey_id, user_id, type, filter, sections) => {
  const results = 
    await pool.query(`
      INSERT INTO 
        reports
        (name, survey_id, user_id, type, filter, sections)
      VALUES
        ($1, $2, $3, $4, $5, $6) 
      RETURNING *`, [name, survey_id, user_id, type, filter, sections]);

  if (results.rows && results.rows.length > 0) {
    const report = results.rows[0];
    const user = await pool.query(`SELECT name FROM users WHERE id=$1`, [report.user_id]);
    if (user.rows && user.rows.length > 0) {
      report.username = user.rows[0].name;
      return report;
    } else {
      return null;
    }
  }
  else
    return null;
}

const updateResult = async (id, json, time_spent, ip_address, is_completed) => {
  const results = 
    await pool.query(`
      UPDATE 
        results
      SET
        json=$2, time_spent=$3, ip_address=$4, is_completed=$5, updated_at=now()
      WHERE
        id=$1
      RETURNING *`, [id, json, time_spent, ip_address, is_completed]);

  if (results.rows && results.rows.length > 0)
    return results.rows[0];
  else
    return null;
}

const copyResultsBySurvey = async (old_survey_id, new_survey_id) => {
  const results = await pool.query(`
    INSERT INTO results (json, survey_id, user_id, time_spent, ip_address, is_completed, created_at, updated_at)
      SELECT json, $1, user_id, time_spent, ip_address, is_completed, created_at, updated_at
      FROM results AS old
      WHERE old.survey_id = $2
    RETURNING *
  `, [new_survey_id, old_survey_id]);
  if (results.rows && results.rows.length > 0)
    return results.rows;
  else
    return [];
}

module.exports = {
  getReportsBySurvey,
  createReport,
};