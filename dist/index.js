import express from 'express';
import cors from 'cors';
import { db } from './db.js';
import constRouter from './api/const/Const.js';
import projectRouter from './api/projects/Project.js';
import taskRouter from './api/tasks/Tasks.js';
import genIdRouter from './api/gen_ids/GenID.js';
import logRouter from './api/logs/Edit.js';
import taskuserRouter from './api/taskusers/TaskUsers.js';
// import "date-time-format-timezone";
// import { setDefaultOptions } from 'date-fns';
// import { enUS } from 'date-fns/locale';
// setDefaultOptions({ locale: enUS });
import { formatInTimeZone } from 'date-fns-tz';
const app = express();
const PORT = 8080;
app.use(cors());
app.use(express.json());
app.use('/api/const/', constRouter);
app.use('/api/projects/', projectRouter);
app.use('/api/tasks/', taskRouter);
app.use('/api/gen_ids/', genIdRouter);
app.use('/api/logs/', logRouter);
app.use('/api/taskusers/', taskuserRouter);
app.listen(PORT, () => {
    console.log('The application is listening '
        + 'on port http://localhost/' + PORT);
});
app.get('/', async (req, res) => {
    res.send('hello human!!! o/: ' + new Date().toString() + " / " + formatInTimeZone(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss"));
});
app.get('/api/ping', async (req, res) => {
    try {
        res.send("pong");
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
app.get('/api/test', async (req, res) => {
    const [results] = await db.query("select * from test");
    res.send(results);
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
app.get("/api/getAvgHelpLeadDaysBeforeDeadline", async (req, res) => {
    try {
        const sql = "select ROUND(AVG(DATEDIFF(deadline, DATE(NOW()))), 1) as avgHelpLeadDay from Task where Task.taskStatusID = 3 and Task.deadline > DATE(NOW())";
        const [result] = await db.query(sql);
        // @ts-expect-error
        res.send(result[0]);
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error querying the database');
    }
});
//# sourceMappingURL=index.js.map