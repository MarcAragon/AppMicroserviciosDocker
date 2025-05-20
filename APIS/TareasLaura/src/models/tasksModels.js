//taskModels.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConection = mysql.createPool({
    host: 'db',
    user: 'root',
    database: 'taskprojectscompany'
});

async function getTasks() {
    try{
       const [result] = await dbConection.query('SELECT * FROM tasks') ;
       return result;
    } catch (error) {
       throw new Error(error.message);
    };
};

async function getTaskByID(id) {
    try {
        let [task] = await dbConection.query('SELECT * FROM tasks WHERE idTarea = ?', [id]);
        return task;

    } catch (error) {
        throw new Error(error.message);
    };  
};

async function uniqueName(nombreTarea) {
    try {
        let [result] = await dbConection.query('SELECT * FROM tasks WHERE nombreTarea = ?', [nombreTarea]);

        if (result.length > 0) {
            throw new Error(`The name ${nombreTarea} is already in use.`)
        }

        return true;
    } catch (error) {
        throw new Error(`Error in the DataBase: ${error.message}`)
    }
};

async function postTask(idProyecto, nombreProyecto, idJefe, nombreTarea, prioridad) {
    try {
        const [result] = await dbConection.query(
            'INSERT INTO tasks (idProyecto, nombreProyecto, idJefe, nombreTarea, prioridad) VALUES (?, ?, ?, ?, ?)',
            [idProyecto, nombreProyecto, idJefe, nombreTarea, prioridad]
        );

        if (result.affectedRows > 0) {
            return {
                idTarea: result.insertId, // Aquí se obtiene el ID autoincrementable
                idProyecto,
                nombreProyecto,
                idJefe,
                nombreTarea,
                prioridad
            };
        } else {
            return null;
        }
    } catch (error) {
        throw new Error("Database error: " + error.message);
    }
};

module.exports = {
    getTasks,
    getTaskByID,
    postTask,
    uniqueName
};
