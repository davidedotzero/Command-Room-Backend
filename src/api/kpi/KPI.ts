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

router.get("/user-log/count/all/:userID", passport.authenticate("jwt", { session: false }), async (req, res) => {
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

`
SELECT
DATE(date) AS log_date,
    COUNT(*) AS log_count
FROM
EditLog
WHERE
userID = 'USER-0000-000001'
GROUP BY
log_date
ORDER BY
    log_date DESC;
`
export default router;
