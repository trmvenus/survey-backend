const pool = require('./pool');

const getResultsBySurvey = async (survey_id) => {
  const results = 
    await pool.query(`
      SELECT 
        *,
        (SELECT name FROM users WHERE results.user_id=users.id) as username
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

const getUncompletedResultBySurveyAndUser = async (survey_id, user_id) => {
  const results = 
    await pool.query(`
      SELECT
        *
      FROM
        results
      WHERE
        survey_id=$1 AND user_id=$2 AND is_completed=false
    `, [survey_id, user_id]);

  if (results.rows && results.rows.length > 0)
    return results.rows[0];
  else {
    return null;
  }
}

const postResult = async (survey_id, user_id, ip_address) => {
  const results = 
    await pool.query(`
      INSERT INTO 
        results
        (json, survey_id, user_id, time_spent, ip_address)
      VALUES
        ('{}', $1, $2, 0, $3) 
      RETURNING *`, [survey_id, user_id, ip_address]);

  if (results.rows && results.rows.length > 0)
    return results.rows[0];
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
  getResultsBySurvey,
  getResultDatesBySurvey,
  getUncompletedResultBySurveyAndUser,
  postResult,
  updateResult,
  copyResultsBySurvey
};