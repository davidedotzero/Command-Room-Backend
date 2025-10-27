import express from 'express';
import cors from 'cors';
import { db } from './db.js';

import constRouter from './api/const/Const.js';
import projectRouter from './api/projects/Project.js';
import taskRouter from './api/tasks/Tasks.js';
import genIdRouter from './api/gen_ids/GenID.js';
import logRouter from './api/logs/Edit.js';
import taskuserRouter from './api/taskusers/TaskUsers.js'
import { formatInTimeZone } from 'date-fns-tz';
import { genMultipleNewID, genSingleNewID, genSingleNewShortID, getBangkokDate } from './util.js';
// import { toNodeHandler } from 'better-auth/node';
// import { auth } from './lib/auth.js';

const app = express();
const PORT: number = 8080;

// app.all('/api/auth/{*any}', toNodeHandler(auth));

app.use(cors());
app.use(express.json());

app.use('/api/const/', constRouter);
app.use('/api/projects/', projectRouter);
app.use('/api/tasks/', taskRouter);
app.use('/api/gen_ids/', genIdRouter);
app.use('/api/logs/', logRouter);
app.use('/api/taskusers/', taskuserRouter);

// heartbeat query for keeping connection alive.
setInterval(() => {
    db.query('SELECT 1')
        .then(() => {
            console.log('Database connection is alive. ' + new Date().toISOString());
        })
        .catch(err => {
            console.error('Database heartbeat query failed:', err);
        });
}, 120000);

app.listen(PORT, () => {
    console.log('The application is listening '
        + 'on port http://localhost/' + PORT);
});

app.get('/', async (req, res) => {
    res.send('hello human!!! o/: ' + getBangkokDate(new Date()).replaceAll('-', '') + new Date().toString() + " / " + formatInTimeZone(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss") + " / " + genSingleNewID("TASK-20251016-000069") + " / " + genSingleNewShortID("PROJECT-2025-000069") + " / " + genMultipleNewID("TASK-20251016-000069", 10).join(", "));
});

app.get('/api/ping', async (req, res) => {
    try {
        res.send("pong");
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
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
        } else {
            res.send(null); // Or res.status(404).send('User not found');
        }
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send('Error querying the database');
    }
});


app.get('/api/getWorkers', async (req, res) => {
    try {
        const [results] = await db.query("SELECT userID, userName FROM User WHERE userID != 'USER-0000-000000' ORDER BY userID ASC");
        res.send(results);
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
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
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send('Error querying the database');
    }
});

app.get("/api/getAvgHelpLeadDaysBeforeDeadline", async (req, res) => {
    try {
        const sql = "select ROUND(AVG(DATEDIFF(deadline, DATE(NOW()))), 1) as avgHelpLeadDay from Task where Task.taskStatusID = 3 and Task.deadline > DATE(NOW())"

        const [result] = await db.query(sql);
        // @ts-expect-error
        res.send(result[0]);

    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send('Error querying the database');
    }
});
