import express from 'express';
import { db } from '../../db.js';
import { formatDateYYYY_MM_DD_Dashes, genSingleNewID, getBangkokDate } from '../../util.js';
const router = express.Router();

// add new log
router.post("/edit/", async (req, res) => {
    try {
        const newLog = req.body;

        if (!newLog) {
            return res.status(400).send('Data is required.');
        }

        const sql = "SELECT eLogID FROM EditLog ORDER BY date DESC LIMIT 1";
        const [results] = await db.execute(sql);
        // @ts-expect-error
        if (results.length <= 0) {
            return res.status(404).send('No tasks found');
        }
        // @ts-expect-error
        const latest_id = results[0].eLogID;
        const new_elogid = genSingleNewID(latest_id);

        // because if fromDeadline or toDeadline is null javascript will parse it as the beginning of unix epoch FOR SOME FUCKING REASON. JUST THROW ME A FUCKING ERROR STOP TRYING TO BE "CLEVER" U IDIOT FUCK TRASH SHIT BITCH NIGERIA
        const insertingFromDeadline = newLog.fromDeadline == null ? null : getBangkokDate(new Date(newLog.fromDeadline));
        const insertingToDeadline = newLog.toDeadline == null ? null : getBangkokDate(new Date(newLog.toDeadline));

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
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send('Error querying the database');
    }
});


router.get('/edit/:taskID', async (req, res) => {
    try {
        const { taskID } = req.params;
        const sql = "SELECT * FROM EditLog JOIN User on EditLog.userID = User.userID WHERE taskID = ? ORDER BY date DESC";
        const [results] = await db.query(sql, [taskID]);
        res.send(results);
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send('Error querying the database');
    }
});

router.patch('/edit/marks/', async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        const { markLogs, unmarkLogs } = req.body;

        if (Array.isArray(markLogs) && markLogs.length > 0) {
            const whereClause = markLogs.map(() => "(eLogID = ?)").join(' OR ');

            const sql = `UPDATE EditLog SET markedDone = TRUE WHERE ${whereClause}`;
            const [result] = await connection.execute(sql, markLogs);

            // "UPDATE `EditLog` SET markedDone = FALSE WHERE eLogID = "LOG - 20251021-000003" or eLogID = "LOG - 20251021-000004""
        }

        if (Array.isArray(unmarkLogs) && unmarkLogs.length > 0) {
            const whereClause = unmarkLogs.map(() => "(eLogID = ?)").join(' OR ');

            const sql = `UPDATE EditLog SET markedDone = FALSE WHERE ${whereClause}`;
            const [result] = await connection.execute(sql, unmarkLogs);
        }

        await connection.commit();

        res.status(201).send({ message: "อัปเดตเครื่องหมายเสร็จสิ้นสำเร็จ" });

    } catch (err) {
        await connection.rollback();
        console.error("Updating EditLogs markedDone transaction failed: ", err);
        console.error(new Date().toISOString());
        console.error("=============================================================");
        res.status(500).send({
            message: "Error updating EditLogs markedDone via transaction.",
            detail: "" + err
        });
    } finally {
        connection.release();
    }
});

export default router;
