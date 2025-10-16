import express from 'express';
import { db } from '../../db.js';
import { formatDateYYYY_MM_DD_Dashes, genSingleNewID } from '../../util.js';
const router = express.Router();

// add new log
router.post("/edit/", async (req, res) => {
    try {
        const newLog = req.body;

        if (!newLog) {
            return res.status(400).send('Data is required.');
        }

        const sql = "SELECT eLogID FROM EditLog ORDER BY date DESC, eLogID DESC LIMIT 1";
        const [results] = await db.execute(sql);
        // @ts-expect-error
        if (results.length <= 0) {
            return res.status(404).send('No tasks found');
        }
        // @ts-expect-error
        const latest_id = results[0].eLogID;
        const new_elogid = genSingleNewID(latest_id);

        // because if fromDeadline or toDeadline is null javascript will parse it as the beginning of unix epoch FOR SOME FUCKING REASON. JUST THROW ME A FUCKING ERROR STOP TRYING TO BE "CLEVER" U IDIOT FUCK TRASH SHIT BITCH NIGERIA
        const insertingFromDeadline = newLog.fromDeadline == null ? null : formatDateYYYY_MM_DD_Dashes(new Date(newLog.fromDeadline));
        const insertingToDeadline = newLog.toDeadline == null ? null : formatDateYYYY_MM_DD_Dashes(new Date(newLog.toDeadline));

        if (!Array.isArray(newLog)) {
            const sql = `
                INSERT INTO EditLog(eLogID, date, reason, fromStatusID, toStatusID, fromDeadline, toDeadline, taskID, userID) VALUES 
                (?,NOW(),?,?,?,?,?,?,?)`
            const params = [new_elogid, newLog.reason, newLog.fromStatusID, newLog.toStatusID, insertingFromDeadline, insertingToDeadline, newLog.taskID, newLog.userID];


            const [result] = await db.query(sql, params);
            res.send(result);
        } else {
            throw new Error("ADDING MULTIPLE EDITLOG RECORDS NOT IMPLEMENTED YET.");
        }

    } catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});

export default router;
