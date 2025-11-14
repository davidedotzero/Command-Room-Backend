import express from 'express';
import { db } from '../../db.js';
import passport from 'passport';
import { pusher } from '../../pusher.js';
import { chunkArray, getUserFromEmail } from '../../util.js';
import type { UserUnseenCount } from '../../types.js';
import { createNotification, getTeamIDsInProject, toastUser, updateUserNotification, updateUserUnseenCount } from './NotificationService.js';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
const router = express.Router();

// TODO: abstract this sheesh
interface RowCount extends RowDataPacket {
    total: number;
}

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

        const userIds_sql = "SELECT userID FROM User WHERE userID != \"USER-0000-000000\""
        const { insertedNotiId, userIds } = await createNotification(data, connection, userIds_sql, []);

        await connection.commit();

        await pusher.trigger("notify-all", "notify-all-toast-event", { message: data.message });
        await updateUserUnseenCount((userIds as unknown) as string[]);
        await updateUserNotification((userIds as unknown) as string[], insertedNotiId);

        res.status(200).send({ message: "Channel notify-all sent. @notify-all-toast-event, @notify-all-notiCard-event" });
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
        if (!data.teamIDs || data.teamIDs.length <= 0) { return res.status(400).send({ message: 'Data: teamIDs is required' }); }


        const userIds_sql = `SELECT userID FROM User WHERE userID != "USER-0000-000000" and userID != ? and teamID in ?`;
        const { insertedNotiId, userIds } = await createNotification(data, connection, userIds_sql, [data.senderID, [data.teamIDs]]);

        await connection.commit();


        // TODO: i dont fucking care i dont wanna make a fucking type
        await toastUser((userIds as Array<any>).map(x => x.userID), data.message);
        await updateUserUnseenCount((userIds as unknown) as string[]);
        await updateUserNotification((userIds as unknown) as string[], insertedNotiId);

        res.status(200).send({ message: `Channel private-team-${data.teamIDs} sent. @private-team-toast-event` });
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

router.post('/teams/:projectID', passport.authenticate("jwt", { session: false }), async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        const data = req.body;
        const { projectID } = req.params;
        if (!data) {
            return res.status(400).send({ message: 'Data is required' });
        }
        if (!data.senderID) { return res.status(400).send({ message: 'Data: senderID is required' }); }
        if (!data.notificationTypeID) { return res.status(400).send({ message: 'Data: notificationTypeID is required' }); }
        if (!data.message) { return res.status(400).send({ message: 'Data: message is required' }); }
        if (data.linkTargetID === undefined) { return res.status(400).send({ message: 'Data: linkTargetID is required' }); }

        const userIds_sql = `
            SELECT userID FROM User WHERE userID != "USER-0000-000000" and userID != ? and teamID in
            (
                (select DISTINCT(teamID) from Task where projectID = ?)
                union
                (select DISTINCT(teamHelpID) from Task where projectID = ? and teamHelpID is not NULL)
            );
        `;
        const { insertedNotiId, userIds } = await createNotification(data, connection, userIds_sql, [data.senderID, projectID, projectID]);

        const teamIDs = await getTeamIDsInProject(projectID, true);

        await connection.commit();

        // TODO: i dont fucking care i dont wanna make a fucking type
        await toastUser((userIds as Array<any>).map(x => x.userID), data.message);
        await updateUserUnseenCount((userIds as unknown) as string[]);
        await updateUserNotification((userIds as unknown) as string[], insertedNotiId);

        res.status(200).send({ message: `Channel private-team-${data.teamIDs} sent. @private-team-toast-event` });
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

router.post('/users', passport.authenticate("jwt", { session: false }), async (req, res) => {
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
        if (!data.userIDs || data.userIDs.length <= 0) { return res.status(400).send({ message: 'Data: userIDs is required' }); }


        // TODO: THIS IS SO BADDDDDDDD. WE ALREADY HAVE USERIDS SO JUST PLUG IT IN CREATENOTIFICATION BUT THAT REQUIRES A LOT OF REFACTORING SO THIS WILL DO FOR NOW ;(
        const userIds_sql = `SELECT userID FROM User WHERE userID != "USER-0000-000000" and userID != ? and userID in ?`;
        const { insertedNotiId, userIds } = await createNotification(data, connection, userIds_sql, [data.senderID, [data.userIDs]]);

        await connection.commit();

        // TODO: i dont fucking care i dont wanna make a fucking type
        await toastUser((userIds as Array<any>).map(x => x.userID), data.message);
        await updateUserUnseenCount((userIds as unknown) as string[]);
        await updateUserNotification((userIds as unknown) as string[], insertedNotiId);

        res.status(200).send({ message: `Channel private-user sent. @private-user-toast-event` });
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

router.get("/unseen-count/:userID", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const { userID } = req.params;
        const sql = "SELECT COUNT(*) as unseenCount FROM `NotificationRecipients` WHERE userID = ? and seen = FALSE;";
        const [result] = await db.query(sql, userID);

        // @ts-expect-error result is a fucking array and i want the first one i dont care
        res.status(200).send(result[0]);
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send({
            message: "Error querying the database.",
            detail: "" + err
        });
    }
});

// SELECT COUNT(*) as unseenCount FROM `NotificationRecipients` WHERE userID = "USER-0000-000001" and seen = FALSE;
// UPDATE NotificationRecipients SET seen = TRUE WHERE userID = "USER-0000-000001" and seen = FALSE;
// SELECT userID, COUNT(*) as unseenCount FROM `NotificationRecipients` where userID in ("USER-0000-000001", "USER-2025-000001") and seen = FALSE group by userID;

router.patch("/mark-seen/:userID", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const { userID } = req.params;
        const sql = "UPDATE NotificationRecipients SET seen = TRUE WHERE userID = ? and seen = FALSE";
        const [result] = await db.query(sql, userID);

        res.status(201).send({ message: "อัปเดตแจ้งเตือน user นี้ว่าอ่านแล้ว ok" });
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send({
            message: "Error querying the database.",
            detail: "" + err
        });
    }
});

router.patch("/mark-visited/:userID/:notiID", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const { userID, notiID } = req.params;
        const sql = "UPDATE NotificationRecipients SET visited = TRUE WHERE userID = ? and notificationID = ?";
        const [result] = await db.query(sql, [userID, notiID]);

        res.status(201).send({ message: "อัปเดตแจ้งเตือน user นี้ว่ากดดูแล้ว ok" });
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send({
            message: "Error querying the database.",
            detail: "" + err
        });
    }
});

router.get("/user/:userID", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const { userID } = req.params;
        const sql = `
            (SELECT  
                NotificationRecipients.notificationID,
                NotificationRecipients.seen,
                NotificationRecipients.visited,
                Notification.senderID,
                User.userName as senderName,
                User.email as senderEmail,
                User.teamID as senderTeamID,
                Team.teamName as senderTeamName,
                Notification.notificationTypeID,
                Notification.message,
                Notification.linkTargetID,
                Notification.createdAt
            FROM NotificationRecipients 
            join Notification on NotificationRecipients.notificationID = Notification.notificationID 
            join User on Notification.senderID = User.userID
            join Team on User.teamID = Team.teamID
            where NotificationRecipients.userID = ? and NotificationRecipients.deleted = FALSE and Notification.createdAt >= CURDATE())

            union all 

            (SELECT  
                NotificationRecipients.notificationID,
                NotificationRecipients.seen,
                NotificationRecipients.visited,
                Notification.senderID,
                User.userName as senderName,
                User.email as senderEmail,
                User.teamID as senderTeamID,
                Team.teamName as senderTeamName,
                Notification.notificationTypeID,
                Notification.message,
                Notification.linkTargetID,
                Notification.createdAt
            FROM NotificationRecipients 
            join Notification on NotificationRecipients.notificationID = Notification.notificationID 
            join User on Notification.senderID = User.userID
            join Team on User.teamID = Team.teamID
            where NotificationRecipients.userID = ? and NotificationRecipients.deleted = FALSE and Notification.createdAt < CURDATE()
            order by Notification.createdAt DESC
            limit 10
            offset 0)

            order by createdAt DESC;
        `;
        const [result] = await db.query(sql, [userID, userID]);

        res.status(200).send(result);
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send({
            message: "Error querying the database.",
            detail: "" + err
        });
    };
});

router.get("/user/:userID/page/:pageNumber", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const PAGE_SIZE = 10;
        const { userID, pageNumber } = req.params;
        const page = parseInt(pageNumber as string || '1', 10);
        const offset = (page - 1) * PAGE_SIZE;

        const noti_sql = `
            SELECT  
                NotificationRecipients.notificationID,
                NotificationRecipients.seen,
                NotificationRecipients.visited,
                Notification.senderID,
                User.userName as senderName,
                User.email as senderEmail,
                User.teamID as senderTeamID,
                Team.teamName as senderTeamName,
                Notification.notificationTypeID,
                Notification.message,
                Notification.linkTargetID,
                Notification.createdAt
            FROM NotificationRecipients 
            JOIN Notification on NotificationRecipients.notificationID = Notification.notificationID 
            JOIN User on Notification.senderID = User.userID
            JOIN Team on User.teamID = Team.teamID
            WHERE NotificationRecipients.userID = ? and NotificationRecipients.deleted = FALSE and Notification.createdAt < CURDATE()
            ORDER BY Notification.createdAt DESC
            LIMIT ?
            OFFSET ?;
        `;

        const count_sql = `
            SELECT COUNT(*) as total 
            FROM NotificationRecipients 
            JOIN Notification on NotificationRecipients.notificationID = Notification.notificationID 
            WHERE NotificationRecipients.userID = ? and NotificationRecipients.deleted = FALSE and Notification.createdAt < CURDATE() 
        `;

        const [[notis], [rowCount]] = await Promise.all(
            [
                db.query(noti_sql, [userID, PAGE_SIZE, offset]),
                db.query<RowCount[]>(count_sql, userID)
            ]
        )

        // @ts-expect-error i have a guard clause around rowCount. IT. FUCKING. WORKS.
        const totalCount = (rowCount && rowCount.length > 0) ? rowCount[0].total : 0;
        const hasMorePage = (page * PAGE_SIZE) < totalCount;

        res.status(200).send({
            notifications: notis,
            hasMorePage: hasMorePage
        });
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send({
            message: "Error querying the database.",
            detail: "" + err
        });
    };
});

/*
SELECT * FROM NotificationRecipients 
join Notification on NotificationRecipients.notificationID = Notification.notificationID 
where NotificationRecipients.userID = ? and NotificationRecipients.deleted = FALSE
order by Notification.createdAt DESC;

SELECT * FROM NotificationRecipients 
join Notification on NotificationRecipients.notificationID = Notification.notificationID 
where NotificationRecipients.userID = ? and NotificationRecipients.deleted = FALSE and DATE(Notification.createdAt) = CURDATE()
order by Notification.createdAt DESC;

SELECT * FROM NotificationRecipients 
join Notification on NotificationRecipients.notificationID = Notification.notificationID 
where NotificationRecipients.userID = ? and NotificationRecipients.deleted = FALSE and DATE(Notification.createdAt) != CURDATE()
order by Notification.createdAt DESC
limit 10;


SELECT  
    NotificationRecipients.notificationID,
    NotificationRecipients.seen,
    NotificationRecipients.visited,
    Notification.senderID,
    User.userName as senderName,
    User.email as senderEmail,
    User.teamID as senderTeamID,
    Team.teamName as senderTeamName,
    Notification.notificationTypeID,
    Notification.message,
    Notification.linkTargetID,
    Notification.createdAt
FROM NotificationRecipients 
join Notification on NotificationRecipients.notificationID = Notification.notificationID 
join User on Notification.senderID = User.userID
join Team on User.teamID = Team.teamID
where NotificationRecipients.userID = ? and NotificationRecipients.deleted = FALSE
order by Notification.createdAt DESC;


*/

export default router;
