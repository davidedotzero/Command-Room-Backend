import type { PoolConnection } from "mysql2/promise";
import { db } from "../../db.js";
import { pusher } from "../../pusher.js";
import type { NotificationDetailed, UserUnseenCount } from "../../types.js";
import { chunkArray } from "../../util.js";

export async function updateUserUnseenCount(userIds: Array<string>) {
    try {
        if (!userIds) {
            return;
        }

        if (userIds.length <= 0) {
            // TODO: notification with no recipients??? throw error here
            return;
        }

        const sql = "SELECT userID, COUNT(*) as unseenCount FROM `NotificationRecipients` where userID in (?) and seen = FALSE and deleted = FALSE group by userID;"
        // @ts-expect-error 
        const [result] = await db.query(sql, [userIds.map(x => x.userID)]);

        const MAX_TRIGGER_BATCH_SIZE = 10;
        const chunkedResult = chunkArray(result as Array<UserUnseenCount>, MAX_TRIGGER_BATCH_SIZE);

        const triggerPromises = chunkedResult.map(chunk => {
            let events = chunk.map(x => {
                return {
                    channel: "private-user-" + x.userID,
                    name: "private-user-unseenCount-event",
                    data: { unseenCount: x.unseenCount },
                }
            });

            return pusher.triggerBatch(events);
        });
        await Promise.all(triggerPromises);

    } catch (err) {
        console.log(err);
    }
}

export async function updateUserNotification(userIds: Array<string>, notiId: number) {
    try {
        if (!userIds) {
            return;
        }

        if (userIds.length <= 0) {
            // TODO: notification with no recipients??? throw error here
            return;
        }

        const sql = `
            SELECT  
                NotificationRecipients.notificationID,
                NotificationRecipients.seen,
                NotificationRecipients.visited,
                Notification.senderID,
                Sender.userName as senderName,
                Sender.email as senderEmail,
                Sender.teamID as senderTeamID,
                SenderTeam.teamName as senderTeamName,
                NotificationRecipients.userID as receiverID,
                Receiver.userName as receiverName,
                Notification.notificationTypeID,
                Notification.message,
                Notification.linkTargetID,
                Notification.createdAt
            FROM NotificationRecipients 
            join Notification on NotificationRecipients.notificationID = Notification.notificationID 
            join User as Sender on Notification.senderID = Sender.userID
            join User as Receiver on NotificationRecipients.userID = Receiver.userID
            join Team as SenderTeam on Sender.teamID = SenderTeam.teamID
            where NotificationRecipients.userID in ? and NotificationRecipients.notificationID = ? and NotificationRecipients.deleted = FALSE and Notification.createdAt >= CURDATE();
        `;

        // @ts-expect-error 
        const [result] = await db.query(sql, [[userIds.map(x => x.userID)], notiId]);

        const MAX_TRIGGER_BATCH_SIZE = 10;
        const chunkedResult = chunkArray(result as Array<NotificationDetailed>, MAX_TRIGGER_BATCH_SIZE);

        const triggerPromises = chunkedResult.map(chunk => {
            let events = chunk.map(x => {
                return {
                    channel: "private-user-" + x.receiverID,
                    name: "private-user-notiCard-event",
                    data: { ...x },
                }
            });

            console.log(events);

            return pusher.triggerBatch(events);
        });
        await Promise.all(triggerPromises);
    } catch (err) {
        console.log(err);
    }
}

export async function getTeamIdsInProject(projectID: string, includeHelpTeam: boolean) {
    console.log("yark yead heeie");
    try {
        const sql = `
            (select DISTINCT(teamID) from Task where projectID = ?)
            union
            (select DISTINCT(teamHelpID) from Task where projectID = ? and teamHelpID is not NULL and ? = TRUE);
        `;
        const [result] = await db.query(sql, [projectID, projectID, includeHelpTeam]);
        // @ts-expect-error result IS A FUCKING ARRAY FUCK YOU
        const yee = result.map(x => x.teamID);
        console.log(yee);

    } catch (err) {
        console.log(err);
    }
}

export async function createNotification(data: any, connection: PoolConnection, recipientIDsQuery: string, recipientIDsQueryParams: Array<any>) {
    const sql = "INSERT INTO `Notification`(`senderID`, `notificationTypeID`, `message`, `linkTargetID`, `createdAt`) VALUES (?, ?, ?, ?, NOW())";
    const [result] = await connection.query(sql, [data.senderID, data.notificationTypeID, data.message, data.linkTargetID]);

    // @ts-expect-error insertId EXISTS BRO
    const insertedNotiId = result.insertId;
    const [userIds] = await connection.query(recipientIDsQuery, recipientIDsQueryParams);

    // @ts-expect-error allUserIds is an array so map frickin exists bruh
    const sql2_values = userIds.map(x => [insertedNotiId, x.userID]);
    const sql2 = "INSERT INTO `NotificationRecipients`(`notificationID`, `userID`) VALUES ?";
    const [result2] = await connection.query(sql2, [sql2_values]);

    return { insertedNotiId, userIds, result2 };
}

