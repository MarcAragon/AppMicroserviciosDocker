//projectsControllers
const {Router} = require('express');
const router = Router();
const projectsModels = require('../models/projectsModels');
const axios = require('axios'); 


router.get('/projects', async (req, res) => {
    try {
        let projects = await projectsModels.getProjects();
        res.json(projects);
    } catch (error) {
        res.status(500).json({error: error.message});
    };
});

async function verifyBoss(id, name) {
    try {
        let result = await axios.get(`http://usuarios:8000/users/${id}`);
        result = result.data;

        if (!result || result.role !== 'boss' || result.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
           throw new Error(`The user with id ${id} and ${name} is not a boss or does not exist`);
        };

        return true;
    } catch (error) {
        throw new Error(`Error verifying boss: ${error.message || error}`);
    };
};

async function verifyEmployee(id) {
    try {
        let result = await axios.get(`http://usuarios:8000/users/${id}`);
        result = result.data;


        if (!result || result.role !=='employee') {
            throw new Error(`The employe whit id: ${id} does not exist or is not an employee.`);
        };

        return result;
    } catch (error) {
        return false;
    };
};

async function verifyUniqueName(project_name) {
    try{
        let result = await projectsModels.verifyUniqueName(project_name);

        if (result.length > 0) {
            throw new Error(`There's another project with the name: ${project_name}`);
        }
    } catch (error) {
        throw new Error(`Error checking project name: ${error.message}`);
    };
};

router.post('/projects', async (req, res) => {

    try {
        let {project_name, boss_id, boss_name, status, team_members} = req.body;

        if (!Array.isArray(team_members) || team_members.length === 0) {
            throw new Error("Team members must be a non-empty array");
        };

        await verifyUniqueName(project_name);
        await verifyBoss(boss_id, boss_name);

        let verify = await Promise.all(team_members.map(id => verifyEmployee(id)))
    
        if (!verify.every(value => value)) {
          throw new Error("One or more employees do not exist");
        };

        await projectsModels.createProjects(
            project_name, 
            boss_id, 
            boss_name, 
            status, 
            team_members
        );

        res.json({ message: "Project created successfully" });
    } catch (error) {
        res.status(400).json({error: error.message});
    }
});

router.get('/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const project = await projectsModels.getProjectById(id);

        if (!project) {
            return res.status(404).json({ error: `Project with ID ${id} not found`});
        }

        res.json(project);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.put('/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateFields = req.body;

        let projectExists = await projectsModels.getProjectById(id);
        if (!projectExists) {
            throw new Error(`Project with id ${id} does not exist`);
        }

        if (updateFields.boss_id && updateFields.boss_name) {
            await verifyBoss(updateFields.boss_id, updateFields.boss_name);
        }

        if (updateFields.team_members) {
            if (!Array.isArray(updateFields.team_members) || updateFields.team_members.length === 0) {
                throw new Error("Team members must be a non-empty array");
            }
            let verify = await Promise.all(updateFields.team_members.map(id => verifyEmployee(id)));
            if (!verify.every(value => value)) {
                throw new Error("One or more employees do not exist");
            }
        }

        await projectsModels.updateProject(id, updateFields);

        res.send("Project updated successfully");
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
