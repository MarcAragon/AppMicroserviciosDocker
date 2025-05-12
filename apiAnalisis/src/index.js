const cors = require('cors');
const morgan = require('morgan');
const express = require('express');
const controllers = require('../src/controllers/controllersAnalisis.js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(controllers);

const PORT = 8004;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`server listening on port: ${PORT}`);
})