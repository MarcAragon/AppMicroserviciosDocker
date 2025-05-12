const mysql = require('mysql2/promise');

const connection = mysql.createPool({
    host: 'localhost',
    database: 'resultados_analisis',
    user: 'root',
    port: 3307
})


async function getTareas() {
    const [tareas] = await connection.query('SELECT * FROM analisis_tareas')
    return tareas
}

module.exports = {
    getTareas
}