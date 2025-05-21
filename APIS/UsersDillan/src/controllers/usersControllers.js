//usersControllers.js
const {Router} = require('express');
const router = Router();
const usersModel = require('../models/usersModel');
const axios = require('axios');

router.get('/users', async (req, res) => {
    let users = await usersModel.getUsers();
    res.json(users);
});

router.get('/users/:id', async (req, res) => {
    let id = req.params.id;
    res.setHeader('Cache-Control', 'no-store');
    try {
       let user = await usersModel.getUserID(id);
       res.json(user);
    } catch (error) {
        res.status(404).json({ ok: false, error: error.message });
    }
});

router.get('/users/role/:role', async (req, res) => {
    let role = req.params.role;
    try {
        if(role !== 'employee' && role !=='boss') {
            throw new Error(`The role value is not valid.`);
        }

        const result = await usersModel.getUsersByRole(role);
        res.json({
            Ok: true, 
            data: result
        });
    } catch (error) {
        res.json({ok: false, error: error.message})
    };
});

router.post('/user', async (req, res) => {
    const { name, department, position, contract_date, role, user } = req.body;

    if (!name || !department || !position || !contract_date || !role || !user) {
        return res.status(400).json({
            ok: false,
            error: 'All fields are required.'
        });
    };

    try { 
        await usersModel.createUser(
           name, 
           department, 
           position, 
           contract_date, 
           role,
           user
        );

        return res.json({
           ok: true,
           msg: 'User created sucesfully.'
        });

    } catch (error) {
        return res.status(400).json({
            ok: false, 
            error: error.message
        });
    };
});

router.delete('/users/:id', async(req, res) => {
    const id = req.params.id;
    
    try {
        let userDel = await usersModel.deleteUsers(id);
        
        return res.send(`Usuario con id ${id} borrado`);

    } catch (error) {
        return res.status(400).json({
            ok: false, 
            error: error.message
        });
    };
});

router.post('/users/login', async (req, res) => {
    const { id, user } = req.body;

    if (!id || !user) {
        return res.status(400).json({
            Ok: false, 
            error: 'ID and User are required.'
        });
    }

    try {
        const result = await usersModel.login(id, user);

        if (result[0].length > 0) {
            const { data: userData } = await axios.get(`http://usuarios:8000/users/${id}`);
            const { role, name } = userData;
        
            res.json({ 
                message: `¡Welcome ${role} ${name}!`, 
                role,
                name,
                id
            });
        } else {
                res.status(401).send('User or id is incorrect.');
            }
        
    } catch (error) {
        console.error('Error en el login:', error.message);
        res.status(500).json({ Ok: false, error: 'Internal server error.' });
    }
});

router.put('/users/:id', async (req, res) => {
    const id = req.params.id;
    const updatedFields = req.body;

    if (Object.keys(updatedFields).length === 0) {
        return res.status(400).json({
            ok: false,
            error: 'At least one field is required to update.'
        });
    }

    try {
        await usersModel.updateUser(id, updatedFields);
        return res.json({
            ok: true,
            msg: `User with id ${id} updated successfully.`
        });

    } catch (error) {
        return res.status(400).json({
            ok: false,
            error: error.message
        });
    }
});


module.exports = router;
