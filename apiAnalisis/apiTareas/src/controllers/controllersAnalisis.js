const { Router } = require('express');
const router = Router();
const models = require('../models/modelsAnalisis');

router.get('/analisis-tareas', async (req, res) => {
    try {
        const tarea = await models.getTareas();
        res.json(tarea)
    } catch (error) {
        res.status(400).json({
            ok: false,
            message: error
        })
    }
})

module.exports = router;