import express from 'express';
import { db } from '../../db.js';
import passport from 'passport';
import { pusher } from '../../pusher.js';
import { getUserFromEmail } from '../../util.js';
const router = express.Router();

router.post('/all', passport.authenticate("jwt", { session: false }), async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        const data = req.body;
        if (!data) {
            return res.status(400).send({ message: 'Data is required' });
        }
        if (!data.senderID) { return res.status(400).send({ message: 'Data: senderID is required' }); }
        if (!data.notificationTypeID) { return res.status(400).send({ message: 'Data: notificationTypeID is required' }); }
        if (!data.message) { return res.status(400).send({ message: 'Data: message is required' }); }
        if (data.linkTargetID === undefined) { return res.status(400).send({ message: 'Data: linkTargetID is required' }); }

        const sql = "INSERT INTO `Notification`(`senderID`, `notificationTypeID`, `message`, `linkTargetID`, `createdAt`) VALUES (?, ?, ?, ?, NOW())";
        const [result] = await connection.query(sql, [data.senderID, data.notificationTypeID, data.message, data.linkTargetID]);

        // @ts-expect-error insertId EXISTS BRO
        const insertedNotiId = result.insertId;
        const [allUserIds] = await connection.query("SELECT userID FROM User WHERE userID != \"USER-0000-000000\"");

        // @ts-expect-error allUserIds is an array so map frickin exists bruh
        const sql2_values = allUserIds.map(x => [insertedNotiId, x.userID]);
        const sql2 = "INSERT INTO `NotificationRecipients`(`notificationID`, `userID`) VALUES ?";
        const [result2] = await connection.query(sql2, [sql2_values]);

        const response = await pusher.trigger("notify-all", "notify-all-event", { message: data.message });
        res.status(200).send({ message: "Channel notify-all sent." });

        await connection.commit();
    } catch (err) {
        await connection.rollback();
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send({
            message: "Error sending notifications in \"notify-all\" channel.",
            detail: "" + err
        });
    } finally {
        connection.release();
    }
});

router.post('/teams', passport.authenticate("jwt", { session: false }), async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        const data = req.body;
        if (!data) {
            return res.status(400).send({ message: 'Data is required' });
        }
        if (!data.senderID) { return res.status(400).send({ message: 'Data: senderID is required' }); }
        if (!data.notificationTypeID) { return res.status(400).send({ message: 'Data: notificationTypeID is required' }); }
        if (!data.message) { return res.status(400).send({ message: 'Data: message is required' }); }
        if (data.linkTargetID === undefined) { return res.status(400).send({ message: 'Data: linkTargetID is required' }); }
        if (!data.teamID) { return res.status(400).send({ message: 'Data: teamID is required' }); }

        const sql = "INSERT INTO `Notification`(`senderID`, `notificationTypeID`, `message`, `linkTargetID`, `createdAt`) VALUES (?, ?, ?, ?, NOW())";
        const [result] = await connection.query(sql, [data.senderID, data.notificationTypeID, data.message, data.linkTargetID]);

        // @ts-expect-error insertId EXISTS BRO
        const insertedNotiId = result.insertId;
        const [teamUserIds] = await connection.query("SELECT userID FROM User WHERE userID != \"USER-0000-000000\" and teamID = ?", data.teamID);

        // @ts-expect-error allUserIds is an array so map frickin exists bruh
        const sql2_values = teamUserIds.map(x => [insertedNotiId, x.userID]);
        const sql2 = "INSERT INTO `NotificationRecipients`(`notificationID`, `userID`) VALUES ?";
        const [result2] = await connection.query(sql2, [sql2_values]);

        const response = await pusher.trigger(`private-team-${data.teamID}`, "private-team-event", { message: data.message });
        res.status(200).send({ message: `Channel private-team-${data.teamID} sent.` });

        await connection.commit();
    } catch (err) {
        await connection.rollback();
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send({
            message: "Error sending notifications in \"notify-all\" channel.",
            detail: "" + err
        });
    } finally {
        connection.release();
    }
});

export default router;
