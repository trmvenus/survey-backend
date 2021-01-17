const pool = require('./pool');

const signInWithEmailAndPassword = async (email, password) => {
    const results = await pool.query('SELECT * FROM users WHERE email=$1 AND password=$2', [email, password]);
    return results.rows;
}

const createUserWithEmailAndPassword = async (name, email, password) => {
    var results = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (results.rows.length > 0) {
        return {success: false};
    } else {
        results = await pool.query('INSERT INTO users(name, email, password) VALUES ($1, $2, $3) RETURNING *', [name, email, password]);
        return {success: true, rows: results.rows };
    }
}

const getUsersWithFilter = async (pageSize, currentPage, orderBy, search) => {
    var results = await pool.query(`
        SELECT * 
        FROM users 
        WHERE POSITION($1 in name) > 0
        ORDER BY ${orderBy} ASC 
        LIMIT $2 OFFSET $3
    `, [search, pageSize, pageSize*(currentPage-1)]);
    return results.rows;
}

const getCountOfUsers = async (search) => {
    var results = await pool.query(`
        SELECT count(id) as count FROM users WHERE POSITION($1 in name) > 0
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

const activateUser = async (user_id, is_active) => {
    var results = await pool.query(`UPDATE users SET is_active = NOT is_active WHERE id=$1 RETURNING *`, [user_id]);
    return results.rows[0];
}

module.exports = {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    getUsersWithFilter,
    getCountOfUsers,
    updateUserPermission,
    activateUser,
};