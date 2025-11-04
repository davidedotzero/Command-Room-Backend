import express from 'express';
import { db } from '../../db.js';
import { genSingleNewID } from '../../util.js';
import passport from 'passport';
const router = express.Router();

router.get('/task', passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const sql = "SELECT taskID FROM Task ORDER BY createdAt DESC, taskID DESC LIMIT 1";
        const [results] = await db.query(sql);

        // @ts-expect-error
        if (results.length <= 0) {
            return res.status(404).send('No tasks found');
        }

        // @ts-expect-error
        const latest_id = results[0].taskID;
        const new_id = genSingleNewID(latest_id);

        res.send(new_id);
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send('Error querying the database');
    }
});

export default router;
