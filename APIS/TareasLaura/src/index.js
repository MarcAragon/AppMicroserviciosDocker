const express = require('express');
const tasksControllers = require('./controllers/tasksControllers');
const morgan = require('morgan');
const app = express();
app.use(morgan('dev'));
app.use(express.json());
app.use(tasksControllers);
require('dotenv').config();
PORT = 8002

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tareas escuchando desde el puerto ${PORT}`);
});