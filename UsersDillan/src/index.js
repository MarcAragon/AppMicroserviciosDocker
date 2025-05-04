const express = require('express');
const cors = require('cors');
const usersControllers = require('./controllers/usersControllers.js');
const morgan = require('morgan');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(usersControllers);
require('dotenv').config();
const PORT = 8000
app.listen(PORT, () => {
    console.log(`Usuarios escuchando desde el puerto ${PORT}`);
});