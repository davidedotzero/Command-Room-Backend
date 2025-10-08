import express from 'express';
import cors from 'cors';
import { db } from './db.js';
// import type { FilteringTask } from './types.js';
const app = express();
const PORT = 8080;
app.use(cors());
app.use(express.json());
// TODO: use JSON_AGGR later
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
            deadline: new Date(row.deadline),
            createdAt: new Date(row.createdAt),
            updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
        };
    });
};
function formatDateYYYY_MM_DD_Slashes(date) {
    return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getFullYear().toString().padStart(2, "0")}`;
}
app.listen(PORT, () => {
    console.log('The application is listening '
        + 'on port http://localhost/' + PORT);
});
app.get('/', async (req, res) => {
    res.send('hello human!!! o/');
});
app.get('/api/verifyEmail/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const sql = "SELECT * FROM User WHERE email = ?";
        const [results] = await db.query(sql, [email]);
        // result.length <= 0 is always false for SELECT queries in mysql2 (returns empty array)
        // @ts-expect-error
        if (results.length > 0) {
            // @ts-expect-error
            res.send(results[0]);
        }
        else {
            res.send(null); // Or res.status(404).send('User not found');
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
app.get('/api/getTest', async (req, res) => {
    try {
        const sql = `
            SELECT *, JSON_ARRAYAGG(JSON_OBJECT('userID', User.userID, 'userName', User.userName)) as users
            FROM Task
            LEFT JOIN TaskUser ON Task.taskID = TaskUser.taskID
            LEFT JOIN User ON TaskUser.userID = User.userID
            LEFT JOIN Team as TeamUser ON User.teamID = TeamUser.teamID
            WHERE Task.taskID = "TASK-20250912-000012"
              AND Task.taskID IN (SELECT taskID FROM TaskUser WHERE TaskUser.userID = "USER-2025-000002")
            GROUP BY Task.taskID;
        `;
        const [results] = await db.query(sql);
        res.send(results);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
app.get('/api/getAllTeams', async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM Team");
        res.send(results);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
app.get('/api/getAllTaskStatuses', async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM TaskStatus");
        res.send(results);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
app.get('/api/getAllDefaultTaskNames', async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM DefaultTaskName");
        res.send(results);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
app.get('/api/getAllProjects', async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM Project");
        res.send(results);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
app.get('/api/getAllActiveProjects', async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM Project WHERE isArchived = FALSE");
        res.send(results);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
app.get('/api/getAllTasksDetailed', async (req, res) => {
    try {
        const sql = `
            SELECT 
                Task.taskID, Task.projectID, Task.taskName, Task.deadline, Task.taskStatusID, Task.teamHelpID, 
                Task.helpReqAt, Task.helpReqReason, Task.logPreview, Task.createdAt, Task.updatedAt, Task.teamID, 
                Team.teamName, TaskStatus.taskStatusName, TeamHelp.teamName as "teamHelpName",
                GROUP_CONCAT(CONCAT_WS(":", User.userID, User.userName, User.email, User.teamID, TeamUser.teamName, User.isAdmin) SEPARATOR ";") as "workers"
            FROM Task
            JOIN Team ON Task.teamID = Team.teamID
            JOIN TaskStatus ON Task.taskStatusID = TaskStatus.taskStatusID
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
app.get('/api/getTasksByProjectIdDetailed/:projectID', async (req, res) => {
    try {
        const { projectID } = req.params;
        const sql = `
            SELECT 
                Task.taskID, Task.projectID, Task.taskName, Task.deadline, Task.taskStatusID, Task.teamHelpID, 
                Task.helpReqAt, Task.helpReqReason, Task.logPreview, Task.createdAt, Task.updatedAt, Task.teamID, 
                Team.teamName, TaskStatus.taskStatusName, TeamHelp.teamName as "teamHelpName",
                GROUP_CONCAT(CONCAT_WS(":", User.userID, User.userName, User.email, User.teamID, TeamUser.teamName, User.isAdmin) SEPARATOR ";") as "workers"
            FROM Task
            JOIN Team ON Task.teamID = Team.teamID
            JOIN TaskStatus ON Task.taskStatusID = TaskStatus.taskStatusID
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
app.get('/api/getAllUsersAsc', async (req, res) => {
    try {
        const [results] = await db.query("SELECT userID, userName, teamID, isAdmin, email FROM User ORDER BY userName ASC");
        res.send(results);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
app.get('/api/getProjectNameById/:projectID', async (req, res) => {
    try {
        const { projectID } = req.params;
        const sql = "SELECT projectName FROM Project WHERE projectID = ? LIMIT 1";
        const [results] = await db.query(sql, [projectID]);
        // @ts-expect-error
        if (results.length > 0) {
            // @ts-expect-error
            res.send(results[0]);
        }
        else {
            res.status(404).send('Project not found');
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
app.get('/api/getLogsByTaskIdDesc/:taskID', async (req, res) => {
    try {
        const { taskID } = req.params;
        const sql = "SELECT * FROM EditLog WHERE taskID = ? ORDER BY date DESC";
        const [results] = await db.query(sql, [taskID]);
        res.send(results);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
app.get('/api/getTasksByUserIdDetailed/:userID', async (req, res) => {
    try {
        const { userID } = req.params;
        const sql = `
            SELECT 
                Task.taskID, Task.projectID, Task.taskName, Task.deadline, Task.taskStatusID, Task.teamHelpID, 
                Task.helpReqAt, Task.helpReqReason, Task.logPreview, Task.createdAt, Task.updatedAt, Task.teamID, 
                Team.teamName, TaskStatus.taskStatusName, TeamHelp.teamName as "teamHelpName",
                GROUP_CONCAT(CONCAT_WS(":", User.userID, User.userName, User.email, User.teamID, TeamUser.teamName, User.isAdmin) SEPARATOR ";") as "workers"
            FROM Task
            JOIN Team ON Task.teamID = Team.teamID
            JOIN TaskStatus ON Task.taskStatusID = TaskStatus.taskStatusID
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
app.get('/api/getLatestTaskID', async (req, res) => {
    try {
        const sql = "SELECT taskID FROM Task ORDER BY createdAt DESC LIMIT 1";
        const [results] = await db.query(sql);
        // @ts-expect-error
        if (results.length > 0) {
            // @ts-expect-error
            res.send(results[0]);
        }
        else {
            res.status(404).send('No tasks found');
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
app.get('/api/isProjectIDExists/:projectID', async (req, res) => {
    try {
        const projectID = req.params.projectID;
        const sql = "select count(projectID) as isValid from Project where projectID = (?)";
        const [results] = await db.query(sql, [projectID]);
        // TODO: if results.length == 0
        // @ts-expect-error
        res.send(results[0]);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
app.post("/api/addTask", async (req, res) => {
    try {
        const newTask = req.body;
        if (!newTask) {
            return res.status(400).send('Data is required.');
        }
        const sql = "INSERT INTO `Task`(`taskID`, `projectID`, `taskName`, `deadline`, `taskStatusID`, `teamHelpID`, `helpReqAt`, `helpReqReason`, `logPreview`, `createdAt`, `updatedAt`, `teamID`) VALUES (?,?,?,?,?,?,?,?,?,FROM_UNIXTIME(?),?,?)";
        const params = [newTask.taskID, newTask.projectID, newTask.taskName, newTask.deadline, newTask.taskStatusID, null, null, null, "", new Date().getTime(), null, newTask.teamID];
        const [result] = await db.query(sql, params);
        console.log(result);
        res.send(result);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
//# sourceMappingURL=index.js.map