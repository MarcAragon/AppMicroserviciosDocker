//C:\Users\Steven\OneDrive\Desktop\TareasAsignadas\src\models\TareasAsignadasModels.js
require('dotenv').config();
const mysql = require('mysql2/promise');

const connection = mysql.createPool({
    host: 'db',
    user: 'root',
    database: 'TareasAsignadas'
});

async function testConnection() {
    try {
        const conn = await connection.getConnection();
        console.log("Conexión a la base de datos establecida correctamente");
        conn.release();
    } catch (error) {
        console.error("Error al conectar a la base de datos:", error);
    }
}

async function traerTareasAsignadas() {
    try {
        const [result] = await connection.query('SELECT * FROM tareasasignadas');
        return result;
    } catch (error) {
        console.error('Error al obtener tareas asignadas:', error);
        throw error;
    }
}

async function traerTareaAsignada(id) {
    try {
        const [result] = await connection.query('SELECT * FROM tareasasignadas WHERE ID = ?', [id]);
        return result[0] || null;
    } catch (error) {
        console.error(`Error al obtener la tarea asignada con ID ${id}:`, error);
        throw error;
    }
}

async function actualizarEstadoTarea(id, estado) {
    try {
        const [result] = await connection.query('UPDATE tareasasignadas SET Estado = ? WHERE ID = ?', [estado, id]);
        return result;
    } catch (error) {
        console.error(`Error al actualizar el estado de la tarea ${id}:`, error);
        throw error;
    }
}

async function crearTareaAsignada(ID, empleadoID, tareaID, proyectoID, fechaEntregaMaxima) {
    try {
        // Convertir la fecha a un objeto Date si es un string
        let fechaEntrega = new Date(fechaEntregaMaxima);

        const query = `
            INSERT INTO tareasasignadas
            (ID, Empleado_ID, Task_ID, Proyect_ID, Fecha_Entrega_Maxima) 
            VALUES (?, ?, ?, ?, ?)
        `;

        const [result] = await connection.execute(query, [ID, empleadoID, tareaID, proyectoID, fechaEntrega]);

        console.log("Tarea insertada con ID:", ID);
        return { insertedId: result.insertId };
    } catch (error) {
        console.error("Error al insertar tarea:", error);
        throw error;
    }
}

async function borrarTareaAsignada(id) {
    try {
        const [result] = await connection.query('DELETE FROM tareasasignadas WHERE ID = ?', [id]);
        return result;
    } catch (error) {
        console.error(`Error al eliminar la tarea asignada con ID ${id}:`, error);
        throw error;
    }
}

async function consultarTareasPorEmpleado(Empleado_ID) {
    try {
        const [result] = await connection.query('SELECT * FROM tareasasignadas WHERE Empleado_ID = ?', [Empleado_ID]);
        return result;
    } catch (error) {
        console.error(`Error al obtener tareas del empleado ${Empleado_ID}:`, error);
        throw error;
    }
}

async function filtrarTareasPorEstado(estado) {
    try {
        const [result] = await connection.query('SELECT * FROM tareasasignadas WHERE Estado = ?', [estado]);
        return result;
    } catch (error) {
        console.error(`Error al filtrar tareas por estado ${estado}:`, error);
        throw error;
    }
}

module.exports = {
    testConnection,
    traerTareasAsignadas,
    traerTareaAsignada,
    actualizarEstadoTarea,
    crearTareaAsignada,
    borrarTareaAsignada,
    consultarTareasPorEmpleado,
    filtrarTareasPorEstado
};
