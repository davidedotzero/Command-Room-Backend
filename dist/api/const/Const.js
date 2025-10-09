import express from 'express';
import { db } from '../../db.js';
const router = express.Router();
router.get('/teams', async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM Team");
        res.send(results);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
router.get('/taskStatuses', async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM TaskStatus");
        res.send(results);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
router.get('/defaultTaskNames', async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM DefaultTaskName");
        res.send(results);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
export default router;
//# sourceMappingURL=Const.js.map