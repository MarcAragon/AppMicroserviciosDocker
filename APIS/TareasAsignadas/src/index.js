//C:\Users\Steven\OneDrive\Desktop\TareasAsignadas\src\index.js
require('dotenv').config();
const morgan = require('morgan');
const express = require('express');
const cors = require('cors');
const TareasAsignadasControllers = require('./controllers/TareasAsignadasControllers');
const analisisRouter = require('./controllers/AnalisisController');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(TareasAsignadasControllers);
app.use("/analisis",analisisRouter);
const PORT = 8003

app.listen(PORT, () => {
    console.log(`Tareas asignadas escuchando desde el puerto ${PORT}`)
});

