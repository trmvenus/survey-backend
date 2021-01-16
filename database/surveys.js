const pool = require('./pool');

const createSurvey = async (name, user_id, category_id) => {
  const results = 
    await pool.query(`
      INSERT INTO 
        surveys
        (name, json, user_id, category_id)
      VALUES
        ($1, $2, $3, $4) 
      RETURNING *`, [name, {}, user_id, category_id]);

  if (results.rows && results.rows.length > 0)
    return results.rows[0];
  else
    return null;
}

const getMySurveys = async (user_id) => {
  const results = await pool.query(`
      SELECT
        *
        , CASE WHEN category_id IS NULL THEN '' ELSE (SELECT name FROM categories WHERE surveys.category_id=categories.id) END AS category
        , (SELECT count(results.id) FROM results WHERE surveys.id = results.survey_id) AS responses
      FROM
        surveys 
      WHERE 
        user_id=$1 AND is_deleted=false 
      ORDER BY 
        created_at DESC 
    `, [user_id]);
  if (results.rows)
    return results.rows;
  else
    return [];
}

const getSurvey = async (survey_id) => {
  const results = await pool.query(`
    SELECT * FROM surveys WHERE id=$1
    `, [survey_id]);
  if (results.rows && results.rows.length > 0)
    return results.rows[0];
  else
    return null;
}

const updateSurvey = async (survey_id, json) => {
  const results = await pool.query(`
    UPDATE surveys SET json = $1 WHERE id = $2 RETURNING *
  `, [json, survey_id]);
  if (results.rows && results.rows.length > 0)
    return results.rows[0];
  else
    return null;
}

const deleteSurveys = async (surveys_ids) => {
  await pool.query('UPDATE surveys SET is_deleted=true WHERE id = ANY($1::int[])', [surveys_ids]);
}

const copySurveys = async (user_id, surveys_ids) => {
  const results = await pool.query(`
    INSERT INTO surveys (name, json, user_id)
      SELECT CONCAT(name, ' (COPY)'), json, $1
      FROM surveys AS old
      WHERE old.id = ANY($2::int[])
    RETURNING *
  `, [user_id, surveys_ids]);
  
  if (results.rows && results.rows.length > 0)
    return results.rows;
  else
    return [];
}

module.exports = {
    createSurvey,
    getMySurveys,
    getSurvey,
    updateSurvey,
    deleteSurveys,
    copySurveys,
};