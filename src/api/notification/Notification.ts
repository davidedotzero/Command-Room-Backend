import express from 'express';
import { db } from '../../db.js';
import passport from 'passport';
import { pusher } from '../../pusher.js';
import { getUserFromEmail } from '../../util.js';
const router = express.Router();

// router.get('/test', async (req, res) => {
//     console.log("yay");
//     const response = await pusher.trigger("test-channel", "test-event", { message: "omkuyguma" });
//     res.status(200).send("yes");
// });

router.post('/testGU', passport.authenticate("jwt", { session: false }), async (req, res) => {
    // console.log("eiei");
    const response = await pusher.trigger("private-kuy-channel-USER-0000-000001", "juanjuanjuan", { message: "GU AENG" });
    res.status(200).send("kuykuykuy");
});

router.post('/testPPAT', passport.authenticate("jwt", { session: false }), async (req, res) => {
    // console.log("eiei");
    const response = await pusher.trigger("private-kuy-channel-USER-2025-000001", "juanjuanjuan", { message: "FROM PPAT" });
    res.status(200).send("kuykuykuy");
});

router.post('/all', passport.authenticate("jwt", { session: false }), async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        const data = req.body;
        console.log(data);
        if (!data) {
            return res.status(400).send({ message: 'Data is required' });
        }
        if (!data.senderID) { return res.status(400).send({ message: 'Data: senderID is required' }); }
        if (!data.notificationTypeID) { return res.status(400).send({ message: 'Data: notificationTypeID is required' }); }
        if (!data.message) { return res.status(400).send({ message: 'Data: message is required' }); }
        if (data.linkTargetID === undefined) { return res.status(400).send({ message: 'Data: linkTargetID is required' }); }


        const sql = "INSERT INTO `Notification`(`senderID`, `notificationTypeID`, `message`, `linkTargetID`, `createdAt`) VALUES (?, ?, ?, ?, NOW())";
        const [result] = await connection.query(sql, [data.senderID, data.notificationTypeID, data.message, data.linkTargetID]);

        // @ts-expect-error
        const insertId = result.insertId;
        console.log(insertId);

        // const sql2 = 

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
});

// router.post('')

export default router;
