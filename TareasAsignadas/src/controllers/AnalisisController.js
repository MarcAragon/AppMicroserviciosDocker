const { Router } = require('express');
const router = Router();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const tareasAsignadasModel = require('../models/TareasAsignadasModels');
const mysql = require('mysql2/promise');

// Configuración de la base de datos de resultados
const resultadosConnection = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'resultados_analisis',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 1. EJECUTAR ANÁLISIS COMPLETO
router.post('/ejecutar', async (req, res) => {
    try {
        // Ruta corregida al archivo Python de análisis
        const pythonScript = path.join(__dirname, '../../analisis/AnalisisTareasAsginadas-Api.py');
        
        console.log('Ruta del script Python:', pythonScript);
        
        // Verificar que el archivo existe
        const fs = require('fs');
        if (!fs.existsSync(pythonScript)) {
            return res.status(404).json({
                success: false,
                message: 'Archivo de análisis no encontrado',
                path: pythonScript
            });
        }
        
        // Ejecutar el script Python con spark-submit
        const proceso = spawn('spark-submit', [pythonScript]);
        
        let output = '';
        let errorOutput = '';
        
        // Capturar salida estándar
        proceso.stdout.on('data', (data) => {
            output += data.toString();
            console.log(`stdout: ${data}`);
        });
        
        // Capturar errores
        proceso.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error(`stderr: ${data}`);
        });
        
        // Manejar errores del proceso
        proceso.on('error', (error) => {
            console.error('Error al ejecutar spark-submit:', error);
            res.status(500).json({
                success: false,
                message: 'Error al ejecutar spark-submit',
                error: error.message
            });
        });
        
        // Cuando termine el proceso
        proceso.on('close', (code) => {
            if (code === 0) {
                res.json({
                    success: true,
                    message: 'Análisis completado exitosamente',
                    output: output,
                    timestamp: new Date()
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Error al ejecutar el análisis',
                    error: errorOutput,
                    code: code
                });
            }
        });
        
    } catch (error) {
        console.error('Error al ejecutar análisis:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar el análisis',
            error: error.message
        });
    }
});

// 2. OBTENER DASHBOARD
router.get('/dashboard', async (req, res) => {
    try {
        // Estadísticas generales
        const [estadisticas] = await resultadosConnection.query(`
            SELECT 
                total_empleados,
                total_tareas_unicas,
                total_asignaciones,
                ROUND(calificacion_promedio_global, 2) as calificacion_promedio,
                ROUND(porcentaje_completado_global, 2) as porcentaje_completado
            FROM estadisticas_generales
            ORDER BY fecha_actualizacion DESC
            LIMIT 1
        `);
        
        // Top 5 empleados
        const [topEmpleados] = await resultadosConnection.query(`
            SELECT 
                empleado_id,
                score_total,
                calificacion,
                porcentaje_completado,
                ranking
            FROM ranking_empleados
            ORDER BY ranking
            LIMIT 5
        `);
        
        // Empleados con problemas
        const [empleadosProblema] = await resultadosConnection.query(`
            SELECT 
                r.empleado_id,
                r.tareas_tardias,
                r.porcentaje_completadas,
                c.calificacion_general_promedio
            FROM rendimiento_empleados r
            LEFT JOIN calidad_empleados c ON r.empleado_id = c.empleado_id
            WHERE r.porcentaje_completadas < 30 
               OR r.tareas_tardias > (r.tareas_completadas * 0.5)
            ORDER BY r.porcentaje_completadas ASC
            LIMIT 5
        `);
        
        res.json({
            success: true,
            data: {
                estadisticas: estadisticas[0],
                topEmpleados,
                empleadosProblema
            }
        });
        
    } catch (error) {
        console.error('Error al obtener dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener dashboard',
            error: error.message
        });
    }
});

// 3. ANÁLISIS POR EMPLEADO
router.get('/empleado/:id', async (req, res) => {
    try {
        const empleadoId = req.params.id;
        
        // Rendimiento
        const [rendimiento] = await resultadosConnection.query(
            'SELECT * FROM rendimiento_empleados WHERE empleado_id = ?',
            [empleadoId]
        );
        
        // Calidad
        const [calidad] = await resultadosConnection.query(
            'SELECT * FROM calidad_empleados WHERE empleado_id = ?',
            [empleadoId]
        );
        
        // Cumplimiento
        const [cumplimiento] = await resultadosConnection.query(
            'SELECT * FROM cumplimiento_plazos WHERE empleado_id = ?',
            [empleadoId]
        );
        
        // Ranking
        const [ranking] = await resultadosConnection.query(
            'SELECT * FROM ranking_empleados WHERE empleado_id = ?',
            [empleadoId]
        );
        
        res.json({
            success: true,
            data: {
                rendimiento: rendimiento[0],
                calidad: calidad[0],
                cumplimiento: cumplimiento[0],
                ranking: ranking[0]
            }
        });
        
    } catch (error) {
        console.error('Error al obtener datos del empleado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener datos del empleado',
            error: error.message
        });
    }
});

// 4. DETECTAR PROBLEMAS
router.get('/problemas', async (req, res) => {
    try {
        // Empleados con alta tasa de retraso
        const [altasTasasRetraso] = await resultadosConnection.query(`
            SELECT 
                r.empleado_id,
                r.tareas_tardias,
                ROUND((r.tareas_tardias * 100.0) / NULLIF(r.tareas_completadas + r.tareas_tardias, 0), 2) as porcentaje_tardias
            FROM rendimiento_empleados r
            WHERE (r.tareas_tardias * 100.0) / NULLIF(r.tareas_completadas + r.tareas_tardias, 0) > 30
        `);
        
        // Empleados con baja calificación
        const [bajasCalificaciones] = await resultadosConnection.query(`
            SELECT 
                empleado_id,
                calificacion_general_promedio
            FROM calidad_empleados
            WHERE calificacion_general_promedio < 2.5
        `);
        
        // Empleados con sobrecarga
        const [sobrecarga] = await resultadosConnection.query(`
            SELECT 
                empleado_id,
                tareas_pendientes,
                total_tareas
            FROM carga_trabajo
            WHERE tareas_pendientes > 50
        `);
        
        res.json({
            success: true,
            data: {
                altasTasasRetraso,
                bajasCalificaciones,
                sobrecarga
            }
        });
        
    } catch (error) {
        console.error('Error al detectar problemas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al detectar problemas',
            error: error.message
        });
    }
});

// 5. ESTADÍSTICAS POR PERÍODO
router.get('/estadisticas/periodo', async (req, res) => {
    try {
        const { año, mes } = req.query;
        
        let query = `
            SELECT 
                empleado_id,
                año,
                mes,
                SUM(cantidad_tareas) as total_tareas,
                AVG(calificacion_promedio) as calificacion_promedio
            FROM patron_temporal
            WHERE 1=1
        `;
        
        const params = [];
        
        if (año) {
            query += ' AND año = ?';
            params.push(año);
        }
        
        if (mes) {
            query += ' AND mes = ?';
            params.push(mes);
        }
        
        query += ' GROUP BY empleado_id, año, mes ORDER BY año DESC, mes DESC';
        
        const [resultados] = await resultadosConnection.query(query, params);
        
        res.json({
            success: true,
            data: resultados
        });
        
    } catch (error) {
        console.error('Error al obtener estadísticas por período:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
});

// 6. RESUMEN DE CALIDAD
router.get('/calidad/resumen', async (req, res) => {
    try {
        const [resumenCalidad] = await resultadosConnection.query(`
            SELECT 
                ROUND(AVG(calidad_promedio), 2) as calidad_promedio_global,
                ROUND(AVG(iniciativa_promedio), 2) as iniciativa_promedio_global,
                ROUND(AVG(comunicacion_promedio), 2) as comunicacion_promedio_global,
                ROUND(AVG(satisfaccion_cliente_promedio), 2) as satisfaccion_promedio_global,
                ROUND(AVG(calificacion_general_promedio), 2) as calificacion_general_global,
                COUNT(*) as empleados_evaluados
            FROM calidad_empleados
            WHERE calificacion_general_promedio IS NOT NULL
        `);
        
        res.json({
            success: true,
            data: resumenCalidad[0]
        });
        
    } catch (error) {
        console.error('Error al obtener resumen de calidad:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resumen de calidad',
            error: error.message
        });
    }
});

// 7. ÚLTIMO ANÁLISIS
router.get('/ultimo-analisis', async (req, res) => {
    try {
        // Obtener fecha de última actualización
        const [ultimaActualizacion] = await resultadosConnection.query(`
            SELECT 
                MAX(fecha_actualizacion) as ultima_actualizacion
            FROM rendimiento_empleados
        `);
        
        // Obtener resumen del último análisis
        const [resumen] = await resultadosConnection.query(`
            SELECT 
                COUNT(DISTINCT empleado_id) as empleados_procesados,
                MIN(fecha_actualizacion) as inicio_proceso,
                MAX(fecha_actualizacion) as fin_proceso
            FROM (
                SELECT empleado_id, fecha_actualizacion FROM rendimiento_empleados
                UNION ALL
                SELECT empleado_id, fecha_actualizacion FROM calidad_empleados
                UNION ALL
                SELECT empleado_id, fecha_actualizacion FROM cumplimiento_plazos
            ) t
        `);
        
        res.json({
            success: true,
            data: {
                ultimaActualizacion: ultimaActualizacion[0].ultima_actualizacion,
                resumen: resumen[0]
            }
        });
        
    } catch (error) {
        console.error('Error al obtener estado del análisis:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estado',
            error: error.message
        });
    }
});

// 8. RANKING COMPLETO
router.get('/ranking', async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        
        const [ranking] = await resultadosConnection.query(`
            SELECT 
                r.empleado_id,
                r.score_total,
                r.calificacion,
                r.porcentaje_completado,
                r.porcentaje_a_tiempo,
                r.ranking,
                re.tareas_completadas,
                re.total_tareas
            FROM ranking_empleados r
            LEFT JOIN rendimiento_empleados re ON r.empleado_id = re.empleado_id
            ORDER BY r.ranking
            LIMIT ?
        `, [parseInt(limit)]);
        
        res.json({
            success: true,
            data: ranking
        });
        
    } catch (error) {
        console.error('Error al obtener ranking:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener ranking',
            error: error.message
        });
    }
});

// 9. DISTRIBUCIÓN DE ESTADOS
router.get('/distribucion-estados', async (req, res) => {
    try {
        const [distribucion] = await resultadosConnection.query(`
            SELECT 
                SUM(estado_asignado) as total_asignadas,
                SUM(estado_entregado) as total_entregadas,
                SUM(estado_tardio) as total_tardias,
                ROUND(SUM(estado_asignado) * 100.0 / 
                    (SUM(estado_asignado) + SUM(estado_entregado) + SUM(estado_tardio)), 2) as porcentaje_asignadas,
                ROUND(SUM(estado_entregado) * 100.0 / 
                    (SUM(estado_asignado) + SUM(estado_entregado) + SUM(estado_tardio)), 2) as porcentaje_entregadas,
                ROUND(SUM(estado_tardio) * 100.0 / 
                    (SUM(estado_asignado) + SUM(estado_entregado) + SUM(estado_tardio)), 2) as porcentaje_tardias
            FROM distribucion_estados
        `);
        
        res.json({
            success: true,
            data: distribucion[0]
        });
        
    } catch (error) {
        console.error('Error al obtener distribución de estados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener distribución',
            error: error.message
        });
    }
});

// 10. PRODUCTIVIDAD POR DÍA
router.get('/productividad/dia', async (req, res) => {
    try {
        const [productividad] = await resultadosConnection.query(`
            SELECT 
                dia_semana,
                COUNT(DISTINCT empleado_id) as empleados_activos,
                SUM(cantidad_tareas) as total_tareas,
                ROUND(AVG(calificacion_promedio), 2) as calificacion_promedio,
                ROUND(AVG(calidad_promedio), 2) as calidad_promedio
            FROM patron_temporal
            GROUP BY dia_semana
            ORDER BY dia_semana
        `);
        
        // Mapear días de la semana
        const diasNombres = ['', 'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const productividadConNombres = productividad.map(dia => ({
            ...dia,
            dia_nombre: diasNombres[dia.dia_semana]
        }));
        
        res.json({
            success: true,
            data: productividadConNombres
        });
        
    } catch (error) {
        console.error('Error al obtener productividad por día:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productividad',
            error: error.message
        });
    }
});

// 12. EJECUTAR CON PYTHON (alternativa para pruebas)
router.post('/ejecutar-python', async (req, res) => {
    try {
        const pythonScript = path.join(__dirname, '../../analisis/AnalisisTareasAsginadas-Api.py');
        
        // Verificar que el archivo existe
        if (!fs.existsSync(pythonScript)) {
            return res.status(404).json({
                success: false,
                message: 'Archivo de análisis no encontrado',
                path: pythonScript
            });
        }
        
        // Ejecutar con python3 en lugar de spark-submit
        const proceso = spawn('python3', [pythonScript]);
        
        let output = '';
        let errorOutput = '';
        
        proceso.stdout.on('data', (data) => {
            output += data.toString();
            console.log(`stdout: ${data}`);
        });
        
        proceso.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error(`stderr: ${data}`);
        });
        
        proceso.on('error', (error) => {
            console.error('Error al ejecutar python3:', error);
            res.status(500).json({
                success: false,
                message: 'Error al ejecutar python3',
                error: error.message
            });
        });
        
        proceso.on('close', (code) => {
            if (code === 0) {
                res.json({
                    success: true,
                    message: 'Análisis completado exitosamente',
                    output: output,
                    timestamp: new Date()
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Error al ejecutar el análisis',
                    error: errorOutput,
                    code: code
                });
            }
        });
        
    } catch (error) {
        console.error('Error al ejecutar análisis:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar el análisis',
            error: error.message
        });
    }
});

// 11. VERIFICAR CONFIGURACIÓN
router.get('/verificar-config', (req, res) => {
    const pythonScript = path.join(__dirname, '../../analisis/AnalisisTareasAsginadas-Api.py');
    const scriptExists = fs.existsSync(pythonScript);
    
    // Verificar si spark-submit está disponible
    const { execSync } = require('child_process');
    let sparkAvailable = false;
    let sparkVersion = '';
    
    try {
        sparkVersion = execSync('spark-submit --version 2>&1').toString();
        sparkAvailable = true;
    } catch (error) {
        sparkAvailable = false;
    }
    
    res.json({
        success: true,
        config: {
            pythonScriptPath: pythonScript,
            pythonScriptExists: scriptExists,
            sparkAvailable: sparkAvailable,
            sparkVersion: sparkAvailable ? sparkVersion.substring(0, 100) : 'No disponible',
            currentDirectory: __dirname,
            nodeVersion: process.version
        }
    });
});

module.exports = router;