//tasksControllers.js
const {Router} = require('express');
const router = Router();
const tasksModels = require('../models/tasksModels');
const axios = require('axios');

async function proyect(idProyecto, nombreProyecto, idJefe) {
    let result = await axios.get(`http://proyectos:8001/projects/${idProyecto}`);
    result = result.data;

    if (!result) {
        throw new Error('The project does not existe.')
    };

    if (result.project_id !== Number(idProyecto)) {
        throw new Error('The project ID is incorrect.');
    }

    if (result.project_name.trim().toLowerCase() !== nombreProyecto.trim().toLowerCase()) {
        throw new Error('The project name does not match.');
    }

    if (result.boss_id !== Number(idJefe)) {
        throw new Error('The boss id is incorrect or does not exist.')
    };
};

router.get('/tasks', async (req, res) => {
    try {
       const tasks = await tasksModels.getTasks();
       res.json(tasks);
    }  catch (error) {
        res.status(500).json({error: error.message});
    }
});

router.get('/tasks/:id', async (req, res) => {
    try {
        let id = req.params.id;
        let task = await tasksModels.getTaskByID(id);

        if (!task || task.length === 0) {
            return res.status(404).json({error: `Task with id ${id} not found`});
        }

        res.json(task[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    };  
});

router.post('/tasks', async (req, res) => {
    try {
        let {idProyecto, nombreProyecto, idJefe, nombreTarea, prioridad} = req.body;

        await proyect(idProyecto, nombreProyecto, idJefe);
        await tasksModels.uniqueName(nombreTarea);

        let task = await tasksModels.postTask(idProyecto, nombreProyecto, idJefe, nombreTarea, prioridad);
        if (!task){
            res.status(400).json({ ok: false, error: "Task could not be created." });
        };

        return res.status(201).json({ ok: true, message: "Task created successfully", task });
    } catch (error) { 
        return res.status(500).json({ ok: false, error: error.message });
    };
});

module.exports = router;
