const { Router } = require('express');
const router = Router();
const tareasAsignadasModel = require('../models/TareasAsignadasModels')
const axios = require('axios')

async function getConnection() {
    await tareasAsignadasModel.testConnection();
};

getConnection();

//Agrege cambio a las rutas assignedT
router.get('/assignedT', async (req, res) => {
    try {
        const result = await tareasAsignadasModel.traerTareasAsignadas();
        res.json(result);
    } catch (error) {
        console.error(error);  // Esto ayudará a ver el error en la terminal
        res.status(500).json({ error: 'Error al obtener tareas asignadas' });
    }
});

router.get('/assignedT/:id', async (req, res) => {
try {
    const id = req.params.id;
    const result = await tareasAsignadasModel.traerTareaAsignada(id);
    if (!result) {
        return res.status(404).json({ error: 'Tarea asignada no encontrada' });
    }
    res.json(result);
} catch (error) {
    res.status(500).json({ error: 'Error al obtener la tarea asignada' });
}
});

router.get('/assignedSts/:estatus', async (req, res) => {
try {
    const estatus = req.params.estatus;
    const result = await tareasAsignadasModel.filtrarTareasPorEstado(estatus);
    if (!result) {
        return res.status(404).json({ error: 'Tarea asignada no encontrada' });
    }
    res.json(result);
} catch (error) {
    res.status(500).json({ error: 'Error al obtener la tarea asignada' });
}
});



router.get('/assignedEmp/:id', async (req, res) => {
    try {

        const id = req.params.id;
        User = await axios.get(`http://localhost:8000/users/${id}`)

        if (User.data) {
            
            const result = await tareasAsignadasModel.consultarTareasPorEmpleado(id);
            
            if (!result) {
            return res.status(404).json({ error: 'Error al traer el empleado o sus tareas' });
            }
            
            res.json(result);
        }
        
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las tareas asignada', reason: error });
    }});

router.put('/assignedT/:id', async (req, res) => {
try {
    const id = req.params.id;
    const Tarea = tareasAsignadasModel.traerTareaAsignada(id)

    if (!Tarea) {
        return res.status(404).json({error: 'La tarea indicada no existe'})
    }

    const { Estado } = req.body;
    console.log (id, Estado)

    if (!Estado) {
        return res.status(400).json({ error: 'El estado es obligatorio' });
    }

    const updated = await tareasAsignadasModel.actualizarEstadoTarea(id, Estado );
    if (!updated) {
        return res.status(404).json({ error: 'Tarea asignada no encontrada' });
    }

    res.json({ message: 'Estado de la tarea asignada actualizado' });
} 

catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Error al actualizar la tarea asignada' });
}
});


router.post('/assignedT', async (req, res) => {
try {
    const { ID, Empleado_ID, Task_ID, Proyect_ID, Fecha_Entrega_Maxima} = req.body;
    console.log(ID, Empleado_ID, Task_ID, Proyect_ID, Fecha_Entrega_Maxima)

    if (!Empleado_ID || !Task_ID || !Fecha_Entrega_Maxima || !ID) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const User = await axios.get(`http://usuarios:8000/users/${Empleado_ID}`)
    const Tarea = tareasAsignadasModel.traerTareaAsignada(Task_ID)
    const Proyecto = await axios.get(`http://proyectos:8001/projects/${Proyect_ID}`)

    if (!User.data || !Tarea.data || !Proyecto.data) {
        return res.status(400).json({error: 'Datos referenciados no existentes'})
    }

    const nuevaTareaAsignada = await tareasAsignadasModel.crearTareaAsignada(
        ID,
        Empleado_ID,
        Task_ID,
        Proyect_ID,
        Fecha_Entrega_Maxima
    );

    res.status(201).json(nuevaTareaAsignada);
} catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Error al crear la tarea asignada' });
}
});


router.delete('/assignedT/:id', async (req, res) => {
try {
    const id = req.params.id;
    const deleted = await tareasAsignadasModel.borrarTareaAsignada(id);

    if (!deleted) {
        return res.status(404).json({ error: 'Tarea asignada no encontrada' });
    }

    res.json({ message: 'Tarea asignada eliminada' });
} catch (error) {
    res.status(500).json({ error: 'Error al eliminar la tarea asignada' });
}
});

module.exports = router; 
