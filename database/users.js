const pool = require('./pool');

const signInWithEmailAndPassword = async (email, password) => {
	const results = await pool.query('SELECT * FROM users WHERE email=$1 AND password=$2', [email, password]);
	return results.rows;
}

const createUserWithEmailAndPassword = async (name, email, password, role = 1,) => {
	var results = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
	if (results.rows.length > 0) {
		return { success: false };
	} else {
		results = await pool.query('INSERT INTO users(name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *', [name, email, password, role]);
		return { success: true, rows: results.rows };
	}
}

const getUsersWithFilter = async (pageSize, currentPage, orderBy, search) => {
	var results = await pool.query(`
				SELECT 
					* 
					, (SELECT name FROM organizations WHERE organizations.id=users.organization_id) as organization_name
        FROM users 
        WHERE POSITION($1 in LOWER(name)) > 0 AND is_deleted=false
        ORDER BY ${orderBy} ASC 
        LIMIT $2 OFFSET $3
    `, [search, pageSize, pageSize * (currentPage - 1)]);
	return results.rows;
}

const getCountOfUsers = async (search) => {
	var results = await pool.query(`
        SELECT count(id) as count FROM users WHERE POSITION($1 in LOWER(name)) > 0 AND is_deleted=false
    `, [search]);
	if (results.rows.length > 0)
		return results.rows[0].count;
	else
		return 0;
}

const updateUserPermission = async (user_id, method) => {
	var results = await pool.query(`UPDATE users SET ${method} = NOT ${method} WHERE id=$1 RETURNING *`, [user_id]);
	return results.rows[0];
}

const updateUserOrganization = async (user_id, organization_id) => {
	console.log({user_id, organization_id})
	var results = await pool.query(`
		UPDATE
			users
		SET
			organization_id = 
				case (SELECT count(id) FROM organizations WHERE organizations.id=$2)
					WHEN 1 then $2
				END
		WHERE
			id=$1
		RETURNING
			id, organization_id, (SELECT name FROM organizations WHERE id=$2) as organization_name
		`, [user_id, organization_id]);

	if (results.rows && results.rows.length > 0)
		return results.rows[0];
	else
		return null;
}

const activateUser = async (user_id, is_active) => {
	var results = await pool.query(`UPDATE users SET is_active = NOT is_active WHERE id=$1 RETURNING *`, [user_id]);
	return results.rows[0];
}

const deleteUsers = async (ids) => {
	const results = await pool.query('UPDATE users SET is_deleted=true WHERE id = ANY($1::uuid[]) RETURNING id', [ids]);

	if (results.rows && results.rows.length > 0)
		return results.rows;
	else
		return [];
}

module.exports = {
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	getUsersWithFilter,
	getCountOfUsers,
	updateUserPermission,
	updateUserOrganization,
	activateUser,
	deleteUsers,
};