import express from 'express';
import { db } from '../../db.js';
const router = express.Router();
router.get('/', async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM Project");
        res.send(results);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
router.get('/active/', async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM Project WHERE isArchived = FALSE");
        res.send(results);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
// TODO: change to /:projectID/name
router.get('/name/:projectID', async (req, res) => {
    try {
        const { projectID } = req.params;
        const sql = "SELECT projectName FROM Project WHERE projectID = ? LIMIT 1";
        const [results] = await db.query(sql, [projectID]);
        // @ts-expect-error
        if (results.length > 0) {
            // @ts-expect-error
            res.send(results[0]);
        }
        else {
            res.status(404).send('Project not found');
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
// TODO: change to /:projectID/name
router.patch('/name/:projectID', async (req, res) => {
    try {
        const { projectID } = req.params;
        const projectName = req.body;
        const sql = "UPDATE `Project` SET `projectName`=? WHERE projectID=?";
        const [results] = await db.query(sql, [projectName.newProjectName, projectID]);
        res.send(results);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
// TODO: change to /:projectID/archive
router.patch('/archive/:projectID', async (req, res) => {
    try {
        const { projectID } = req.params;
        const isArchived = req.body.isArchived;
        const sql = "UPDATE `Project` SET `isArchived`=? WHERE projectID=?";
        const [results] = await db.query(sql, [isArchived, projectID]);
        res.send(results);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
export default router;
//# sourceMappingURL=Project.js.map