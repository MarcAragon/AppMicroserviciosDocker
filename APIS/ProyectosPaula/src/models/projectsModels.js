//projectsModels

require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConection = mysql.createPool({
    host: 'db',
    user: 'root',
    database: 'projectscompany'
});

async function verifyUniqueName(name) {
    try{
        let [result] = await dbConection.query('SELECT * FROM projects WHERE project_name = ?', [name]);
        return result;
    } catch (error) {
        throw new Error(`Error checking project name: ${error.message}`);
    };
};

async function getProjects() {
    try {
        const [results] = await dbConection.query('SELECT * FROM projects');
        return results;
    } catch (error) {
        throw new Error(error.message);
    };
};

async function createProjects(
    project_name, 
    boss_id, 
    boss_name, 
    status, 
    team_members) {

    try {

        const [createdProject] = await dbConection.query('INSERT INTO projects VALUES(null, ?, ?, ?, ?, ?)',[
            project_name, 
            boss_id, 
            boss_name, 
            status, 
            JSON.stringify(team_members)]
        );

        return createdProject;
    } catch (error) {
       throw new Error(error.message);
    };
};

async function getProjectById(id) {
    try {
        const [results] = await dbConection.query('SELECT * FROM projects WHERE project_id = ?', [id]);
        return results.length > 0 ? results[0] : null;
    } catch (error) {
        throw new Error(error.message);
    }
};

async function updateProject(id, updateFields) {
    try {
        const fields = Object.keys(updateFields);
        const values = Object.values(updateFields);

        if (fields.length === 0) {
            throw new Error("No fields provided for update");
        }

        const setClause = fields.map(field => `${field} = ?`).join(', ');

        const [updatedProject] = await dbConection.query(
            `UPDATE projects SET ${setClause} WHERE project_id = ?`,
            [...values, id]
        );

        if (updatedProject.affectedRows === 0) {
            throw new Error(`Project with id ${id} not found`);
        }

        return updatedProject;
    } catch (error) {
        throw new Error(error.message);
    }
}


module.exports = {
    getProjects,
    createProjects,
    updateProject,
    getProjectById,
    verifyUniqueName
};
