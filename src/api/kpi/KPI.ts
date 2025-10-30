import express from 'express';
import { db } from '../../db.js';
import passport from 'passport';
const router = express.Router();

router.get("/avg-help-lead-days", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const sql = "select ROUND(AVG(DATEDIFF(deadline, DATE(NOW()))), 1) as avgHelpLeadDay from Task where Task.taskStatusID = 3 and Task.deadline > DATE(NOW())"

        const [result] = await db.query(sql);
        // @ts-expect-error
        res.send(result[0]);

    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send('Error querying the database');
    }
});

export default router;
