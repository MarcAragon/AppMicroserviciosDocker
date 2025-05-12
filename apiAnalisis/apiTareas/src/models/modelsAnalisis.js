const mysql = require('mysql2/promise');

const connection = mysql.createPool({
    host: 'db',
    database: 'resultados_analisis',
    user: 'root'
})


async function getTareas() {
    const [tareas] = await connection.query('SELECT * FROM analisis_tareas')
    return tareas
}

module.exports = {
    getTareas
}