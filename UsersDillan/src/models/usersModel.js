//usersModel.js
require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConection = mysql.createPool({
    host: 'db',
    user: 'root',
    database: 'userscompany'
});

//Helpers
async function confirmUser(user) {
    const [users] = await dbConection.query('SELECT COUNT(*) AS total FROM users WHERE user = ?', [user]);
    if (users[0].total > 0) {
        throw new Error(`There's another user with the user name: ${user}`)
    };
};

async function confirmID(id) {

    const [users] = await dbConection.query('SELECT COUNT(*) AS total FROM users WHERE id = ?', [id]);
    if (users[0].total === 0) {
        throw new Error(`There's no user with id ${id}`)
    };
};
//Helpers

async function getUsers() {
    const [users] = await dbConection.query('SELECT * FROM users')
    return users
}

async function getUsersByRole(role) {
    const [users] = await dbConection.query('SELECT * FROM users WHERE role = ?', [role]);
    return users;
};

async function getUserID(id) {
    try{    
        
        const [rows] = await dbConection.query('SELECT * FROM users WHERE id = ?', [id]);
        if (rows.length === 0) {
            throw new Error(`No se encontró un usuario con id ${id}`);
        }

        return rows[0];
    } catch (error) {
        throw error;
    };
};

async function createUser(
    name, 
    department, 
    position, 
    contract_date, 
    role,
    user
) {

    try {

        await confirmUser(user);

        const [userCreated] = await dbConection.query('INSERT INTO users VALUES(null, ?, ?, ?, ?, ?, ?)', 
            [name, 
            department, 
            position, 
            contract_date, 
            role,
            user]
        );

        return userCreated;
    } catch (error) {
        throw new Error('Error creating the user: ' + error.message)
    };
};

async function deleteUsers(id) {
    try{
       await confirmID(id);
       
       const [result] = await dbConection.query('DELETE FROM users WHERE id = ?', [id]);

       return result;

    } catch (error) {
        throw new Error(`Thers's no user with ${id}: ${error.message}`);
    };

};

async function login(id, user) {
    console.log(`Datos recibidos: ID=${id}, User=${user}`);

    try {
        const result = await dbConection.query(
            'SELECT * FROM users WHERE id = ? AND user = ?', 
            [id, user]
        );
        return result;
    } catch (error) {
        console.error('Error en la consulta SQL:', error.message);
        throw new Error('Database query failed.');
    }
}

async function updateUser(id, updatedFields) {
    try {
        await confirmID(id);

        // Campos que NO se pueden modificar
        const restrictedFields = ["id", "contract_date", "role", "user"];

        // Filtrar solo los campos permitidos
        const validFields = Object.keys(updatedFields).filter(field => !restrictedFields.includes(field));

        if (validFields.length === 0) {
            throw new Error("No valid fields to update.");
        }

        const values = validFields.map(field => updatedFields[field]);
        const query = `UPDATE users SET ${validFields.map(field => `${field} = ?`).join(", ")} WHERE id = ?`;

        values.push(id); // Agregar el ID al final para el WHERE

        const [result] = await dbConection.query(query, values);
        return result;

    } catch (error) {
        throw new Error(`Error updating user: ${error.message}`);
    }
};

module.exports = {
    getUsers,
    deleteUsers,
    createUser,
    getUserID, 
    updateUser,
    login,
    getUsersByRole
}
