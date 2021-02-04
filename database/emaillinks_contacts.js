const pool = require('./pool');
const format = require('pg-format');

const createEmailLinkContacts = async (rows) => {
  const results = 
    await pool.query(format(`
      INSERT INTO emaillinks_contacts(link_id, email_address, first_name, last_name) VALUES %L RETURNING *
    `, [rows]), []);

  if (results.rows && results.rows.length > 0)
    return results.rows;
  else
    return [];
}

const getEmailLinkContactsByLinkId = async (link_id) => {
  const results = 
    await pool.query(`
      SELECT * FROM emaillinks_contacts WHERE link_id=$1
    `, [link_id]);

  if (results.rows && results.rows.length > 0)
    return results.rows;
  else
    return [];
}

module.exports = {
  createEmailLinkContacts,
  getEmailLinkContactsByLinkId,
};