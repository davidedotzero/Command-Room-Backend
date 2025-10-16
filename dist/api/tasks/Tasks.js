import express from 'express';
import { db } from '../../db.js';
import { formatDateYYYY_MM_DD_Dashes, getBangkokDate } from '../../util.js';
import { formatInTimeZone } from 'date-fns-tz';
const router = express.Router();
// TODO: use JSON_ARRAYAGG later like this
// const sql = `
//     SELECT *, JSON_ARRAYAGG(JSON_OBJECT('userID', User.userID, 'userName', User.userName)) as users
//     FROM Task
//     LEFT JOIN TaskUser ON Task.taskID = TaskUser.taskID
//     LEFT JOIN User ON TaskUser.userID = User.userID
//     LEFT JOIN Team as TeamUser ON User.teamID = TeamUser.teamID
//     WHERE Task.taskID = "TASK-20250912-000012"
//       AND Task.taskID IN (SELECT taskID FROM TaskUser WHERE TaskUser.userID = "USER-2025-000002")
//     GROUP BY Task.taskID;
// `;
// const [results] = await db.query(sql);
const parseWorkerString = (results) => {
    // @ts-expect-error
    return results.map((row) => {
        let workers = null;
        if (row.workers) {
            // @ts-expect-error
            workers = row.workers.split(';').map((workerStr) => {
                const [userID, userName, email, teamID, teamName, isAdmin] = workerStr.split(':');
                return { userID, userName, email, teamID, teamName, isAdmin: isAdmin === '1' };
            });
        }
        return {
            ...row,
            workers,
            deadline: new Date(row.deadline), // TODO: maybe new Date() is not necessary cuz it gonna get turn into ISOString anyway when we throw it back to frontend
            createdAt: new Date(row.createdAt),
            updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
        };
    });
};
router.get('/', async (req, res) => {
    try {
        const sql = `
            SELECT 
                Task.taskID, Task.projectID, Task.taskName, Task.deadline, Task.taskStatusID, Task.teamHelpID, 
                Task.helpReqAt, Task.helpReqReason, Task.logPreview, Task.createdAt, Task.updatedAt, Task.teamID, 
                Team.teamName, TaskStatus.taskStatusName, TeamHelp.teamName as "teamHelpName", Project.projectName,
                GROUP_CONCAT(CONCAT_WS(":", User.userID, User.userName, User.email, User.teamID, TeamUser.teamName, User.isAdmin) SEPARATOR ";") as "workers"
            FROM Task
            JOIN Team ON Task.teamID = Team.teamID
            JOIN TaskStatus ON Task.taskStatusID = TaskStatus.taskStatusID
            JOIN Project ON Task.projectID = Project.projectID
            LEFT JOIN Team as TeamHelp ON Task.teamHelpID = TeamHelp.teamID
            LEFT JOIN TaskUser ON Task.taskID = TaskUser.taskID
            LEFT JOIN User ON TaskUser.userID = User.userID
            LEFT JOIN Team as TeamUser ON User.teamID = TeamUser.teamID
            GROUP BY Task.taskID;
        `;
        const [results] = await db.query(sql);
        const finalResult = parseWorkerString(results);
        res.send(finalResult);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
router.get('/pid/:projectID', async (req, res) => {
    try {
        const { projectID } = req.params;
        const sql = `
            SELECT 
                Task.taskID, Task.projectID, Task.taskName, Task.deadline, Task.taskStatusID, Task.teamHelpID, 
                Task.helpReqAt, Task.helpReqReason, Task.logPreview, Task.createdAt, Task.updatedAt, Task.teamID, 
                Team.teamName, TaskStatus.taskStatusName, TeamHelp.teamName as "teamHelpName", Project.projectName,
                GROUP_CONCAT(CONCAT_WS(":", User.userID, User.userName, User.email, User.teamID, TeamUser.teamName, User.isAdmin) SEPARATOR ";") as "workers"
            FROM Task
            JOIN Team ON Task.teamID = Team.teamID
            JOIN TaskStatus ON Task.taskStatusID = TaskStatus.taskStatusID
            JOIN Project ON Task.projectID = Project.projectID
            LEFT JOIN Team as TeamHelp ON Task.teamHelpID = TeamHelp.teamID
            LEFT JOIN TaskUser ON Task.taskID = TaskUser.taskID
            LEFT JOIN User ON TaskUser.userID = User.userID
            LEFT JOIN Team as TeamUser ON User.teamID = TeamUser.teamID
            WHERE Task.projectID = ?
            GROUP BY Task.taskID;
        `;
        const [results] = await db.query(sql, [projectID]);
        const finalResult = parseWorkerString(results);
        res.send(finalResult);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
router.get('/uid/:userID', async (req, res) => {
    try {
        const { userID } = req.params;
        const sql = `
            SELECT 
                Task.taskID, Task.projectID, Task.taskName, Task.deadline, Task.taskStatusID, Task.teamHelpID, 
                Task.helpReqAt, Task.helpReqReason, Task.logPreview, Task.createdAt, Task.updatedAt, Task.teamID, 
                Team.teamName, TaskStatus.taskStatusName, TeamHelp.teamName as "teamHelpName", Project.projectName,
                GROUP_CONCAT(CONCAT_WS(":", User.userID, User.userName, User.email, User.teamID, TeamUser.teamName, User.isAdmin) SEPARATOR ";") as "workers"
            FROM Task
            JOIN Team ON Task.teamID = Team.teamID
            JOIN TaskStatus ON Task.taskStatusID = TaskStatus.taskStatusID
            JOIN Project ON Task.projectID = Project.projectID
            LEFT JOIN Team as TeamHelp ON Task.teamHelpID = TeamHelp.teamID
            LEFT JOIN TaskUser ON Task.taskID = TaskUser.taskID
            LEFT JOIN User ON TaskUser.userID = User.userID
            LEFT JOIN Team as TeamUser ON User.teamID = TeamUser.teamID
            WHERE Task.taskID IN (SELECT taskID FROM TaskUser WHERE TaskUser.userID = ?)
            GROUP BY Task.taskID;
        `;
        const [results] = await db.query(sql, [userID]);
        const finalResult = parseWorkerString(results);
        res.send(finalResult);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
router.post("/", async (req, res) => {
    try {
        const newTask = req.body;
        if (!newTask) {
            return res.status(400).send('Data is required.');
        }
        // console.log(newTask);
        // console.log(newTask.deadline);
        // console.log(new Date(newTask.deadline));
        // console.log(formatDateYYYY_MM_DD_Dashes(new Date(newTask.deadline)));
        // console.log(formatInTimeZone(new Date(newTask.deadline), 'Asia/Bangkok', "yyyy-MM-dd HH:mm:ss"));
        // return;
        console.log(newTask.deadline);
        console.log(new Date(newTask.deadline));
        console.log(getBangkokDate(new Date(newTask.deadline)));
        if (!Array.isArray(newTask)) {
            const sql = "INSERT INTO `Task`(`taskID`, `projectID`, `taskName`, `deadline`, `taskStatusID`, `teamHelpID`, `helpReqAt`, `helpReqReason`, `logPreview`, `createdAt`, `updatedAt`, `teamID`) VALUES (?,?,?,?,?,?,?,?,?,NOW(),?,?)";
            const params = [
                newTask.taskID,
                newTask.projectID,
                newTask.taskName,
                getBangkokDate(new Date(newTask.deadline)),
                newTask.taskStatusID,
                null,
                null,
                null,
                "",
                null,
                newTask.teamID
            ];
            const [result] = await db.query(sql, params);
            res.send(result);
        }
        else {
            throw new Error("ADDING MULTIPLE TASK RECORDS NOT IMPLEMENTED YET.");
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
// update
router.put("/", async (req, res) => {
    try {
        const updateData = req.body;
        if (!updateData) {
            return res.status(400).send('Data is required.');
        }
        if (Array.isArray(updateData)) {
            throw new Error("Only allow updating one record at a time");
        }
        const taskID = updateData.taskID;
        const sql = "UPDATE `Task` SET `taskName`=?,`deadline`=?,`taskStatusID`=?,`teamHelpID`=?,`helpReqAt`=?,`helpReqReason`=?,`logPreview`=?,`updatedAt`=NOW(),`teamID`=? WHERE taskID = ?";
        const params = [
            updateData.taskName,
            getBangkokDate(new Date(updateData.deadline)),
            updateData.taskStatusID,
            updateData.teamHelpID,
            updateData.helpReqAt === null ? null : getBangkokDate(new Date(updateData.helpReqAt)),
            updateData.helpReqReason,
            updateData.logPreview,
            updateData.teamID,
            taskID
        ];
        const [result] = await db.query(sql, params);
        res.send(result);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
export default router;
//# sourceMappingURL=Tasks.js.map