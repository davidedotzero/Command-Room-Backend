import express from 'express';
import { db } from '../../db.js';
import { formatDateYYYY_MM_DD_Dashes, genSingleNewID, getBangkokDate } from '../../util.js';
import passport from 'passport';
const router = express.Router();

router.get('/edit/:taskID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { taskID } = req.params;
        const sql = "SELECT * FROM EditLog JOIN User on EditLog.userID = User.userID WHERE taskID = ? ORDER BY markedDone ASC, date DESC";
        const [results] = await db.query(sql, [taskID]);
        res.send(results);
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send('Error querying the database');
    }
});

router.patch('/edit/marks/', passport.authenticate('jwt', { session: false }), async (req, res) => {
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
