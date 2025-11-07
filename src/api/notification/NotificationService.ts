import { db } from "../../db.js";
import { pusher } from "../../pusher.js";
import type { UserUnseenCount } from "../../types.js";
import { chunkArray } from "../../util.js";

export async function updateUserUnseenCount(userIds: Array<string>) {
    try {
        if (!userIds) {
            return;
        }

        if (userIds.length <= 0) {
            return;
        }

        const sql = "SELECT userID, COUNT(*) as unseenCount FROM `NotificationRecipients` where userID in (?) and seen = FALSE group by userID;"
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
