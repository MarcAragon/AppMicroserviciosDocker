const express = require('express');
const cors = require('cors');
const projectsControllers = require('./controllers/projectsControllers');
const morgan = require('morgan');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(projectsControllers);
require('dotenv').config();
PORT = 8001

app.listen(PORT, () => {
    console.log(`Proyectos escuchando desde el puerto ${PORT}`);
});