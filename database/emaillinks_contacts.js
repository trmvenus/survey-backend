const pool = require('./pool');
const format = require('pg-format');

const createEmailLinkContacts = async (rows) => {

  console.log(format(`
  INSERT INTO emaillinks_contacts(link_id, email_address, first_name, last_name) VALUES %L RETURNING *
`, rows));

  const results = 
    await pool.query(format(`
      INSERT INTO emaillinks_contacts(link_id, email_address, first_name, last_name) VALUES %L RETURNING *
    `, rows), []);

  if (results.rows && results.rows.length > 0)
    return results.rows;
  else
    return [];
}

const getEmailLinkContactsByLinkId = async (link_id) => {
  const results = 
    await pool.query(`
      SELECT * FROM emaillinks_contacts WHERE link_id=$1 ORDER BY id ASC
    `, [link_id]);

  if (results.rows && results.rows.length > 0)
    return results.rows;
  else
    return [];
}

const getEmailLinkContactByLinkIdAndEmail = async (link_id, email) => {
  const results = 
    await pool.query(`
      SELECT * FROM emaillinks_contacts WHERE link_id=$1 AND email_address=$2
    `, [link_id, email]);

  if (results.rows && results.rows.length > 0)
    return results.rows[0];
  else
    return null;
}

const setContactStatus = async (id, status) => {
  const results = 
    await pool.query(`
      UPDATE emaillinks_contacts SET status=$2 WHERE id=$1 RETURNING *
    `, [id, status ? 'sent' : 'failed']);

  if (results.rows && results.rows.length > 0)
    return results.rows[0];
  else
    return null;
}

const setEmailOpenById = async (id) => {
  const results = 
    await pool.query(`
      UPDATE emaillinks_contacts SET is_open=true WHERE id=$1 RETURNING *
    `, [id]);

  if (results.rows && results.rows.length > 0)
    return results.rows[0];
  else
    return null;
}

module.exports = {
  createEmailLinkContacts,
  getEmailLinkContactsByLinkId,
  getEmailLinkContactByLinkIdAndEmail,
  setContactStatus,
  setEmailOpenById,
};