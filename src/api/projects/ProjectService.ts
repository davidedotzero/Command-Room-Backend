import type { PoolConnection } from "mysql2/promise";
import { genMultipleNewID, genSingleNewID, genSingleNewShortID, formatDateYYYY_MM_DD_Dashes, getBangkokDate, getBangkokTimestamp } from '../../util.js';

export async function createProjectWithTasks(data: any, connection: PoolConnection) {
    // get new projectID
    const sql = "SELECT projectID FROM Project ORDER BY createdAt DESC LIMIT 1";
    const [results] = await connection.execute(sql);
    // @ts-expect-error
    if (results.length <= 0) {
        throw new Error('TODO: handle empty project table. No project found.');
    }
    // @ts-expect-error
    const latest_projectID = results[0].projectID;
    const new_projectID = genSingleNewShortID(latest_projectID);

    // TODO: check new_projectID valid with sql here

    // insert new project
    const sql2 = "INSERT INTO `Project`(`projectID`, `projectName`, `isArchived`, `createdAt`) VALUES (?,?,FALSE,NOW())"
    const [results2] = await connection.query(sql2, [new_projectID, data.projectName]);

    if (!data.tasks || data.tasks.length <= 0) {
        return { insertedProjectID: new_projectID, message: "สร้างโปรเจกต์เปล่าสำเร็จ" };
    }

    // get new taskIDs
    const sql3 = "SELECT taskID FROM Task ORDER BY createdAt DESC, taskID DESC LIMIT 1;";
    const [results3] = await connection.execute(sql3);
    // @ts-expect-error
    if (results3.length <= 0) {
        throw new Error('TODO: handle empty task table. No task found.');
    }

    // @ts-expect-error
    const latest_taskID = results3[0].taskID;
    const new_taskIDs = genMultipleNewID(latest_taskID, data.tasks.length);
    // TODO: handle duplicate key

    // insert new tasks
    const sql4 = "INSERT INTO `Task`(`taskID`, `projectID`, `taskName`, `deadline`, `taskStatusID`, `createdAt`, `teamID`) VALUES ?"
    // @ts-expect-error
    const values = data.tasks.map((x, idx) =>
        [
            new_taskIDs[idx],
            new_projectID,
            x.taskName,
            getBangkokDate(new Date(x.deadline)),
            1,
            getBangkokTimestamp(new Date()), // basically sql NOW() in utc+7
            x.team.teamID
        ]);
    const [results4] = await connection.query(sql4, [values]);

    return { insertedProjectID: new_projectID, insertedTaskIDs: new_taskIDs, message: "สร้างโปรเจกต์พร้อม Task สำเร็จ" };
}
