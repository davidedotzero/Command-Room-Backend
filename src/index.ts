import express from 'express';
import cors from 'cors';
import { db } from './db.js';

import constRouter from './api/const/Const.js';
import projectRouter from './api/projects/Project.js';
import taskRouter from './api/tasks/Tasks.js';
import genIdRouter from './api/gen_ids/GenID.js';
import logRouter from './api/logs/Edit.js';
import taskuserRouter from './api/taskusers/TaskUsers.js';
import kpiRouter from './api/kpi/KPI.js';
import notificationRouter from './api/notification/Notification.js';

import { formatInTimeZone } from 'date-fns-tz';
import { genMultipleNewID, genSingleNewID, genSingleNewShortID, getBangkokDate, getUserFromEmail } from './util.js';
import { pusher } from './pusher.js';
import type { User } from './types.js';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import assert from 'assert';

const app = express();
const PORT: number = 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // needed this for pusher private route for some reason???

app.use(passport.initialize());
import './passport.js';

app.use('/api/const/', constRouter);
app.use('/api/projects/', projectRouter);
app.use('/api/tasks/', taskRouter);
app.use('/api/gen_ids/', genIdRouter);
app.use('/api/logs/', logRouter);
app.use('/api/taskusers/', taskuserRouter);
app.use('/api/kpi/', kpiRouter);
app.use('/api/noti/', notificationRouter);

// heartbeat query for keeping connection alive.
// setInterval(() => {
//     db.query('SELECT 1')
//         .then(() => {
//             console.log('Database connection is alive. ' + new Date().toISOString());
//         })
//         .catch(err => {
//             console.error('Database heartbeat query failed:', err);
//         });
// }, 120000);

app.get('/api/auth/google', passport.authenticate('google', {
    scope: ["profile", "email"],
    session: false,
    prompt: 'select_account'
}));

app.get('/api/auth/google/redirect', passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login-failed` }), async (req, res) => {
    // TODO: validate req

    // @ts-expect-error
    const email = req?.user?.emails![0].value;
    const sql = "SELECT 1 FROM User WHERE email = ?";
    const [results] = await db.query(sql, [email]);
    // @ts-expect-error
    if (results.length <= 0) {
        res.redirect(`${process.env.FRONTEND_URL}/whoru`);
        return;
    }

    const payload = {
        // @ts-expect-error
        id: req?.user?.id,
        // @ts-expect-error
        email: req?.user?.emails![0].value
    };

    // @ts-expect-error
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: process.env.JWT_EXPIRES as string })
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
});

app.listen(PORT, () => {
    console.log('The application is listening '
        + 'on port http://localhost/' + PORT);
});

app.get('/', async (req, res) => {
    res.send('hello human!!! o/: ' + getBangkokDate(new Date()).replaceAll('-', '') + new Date().toString() + " / " + formatInTimeZone(new Date(), "Asia/Bangkok", "yyyy-MM-dd HH:mm:ss") + " / " + genSingleNewID("TASK-20251016-000069") + " / " + genSingleNewShortID("PROJECT-2025-000069") + " / " + genMultipleNewID("TASK-20251016-000069", 10).join(", "));
});

app.get('/api/ping', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        res.send("pong");
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send('Error querying the database');
    }
});

app.get('/api/user/me', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        // @ts-expect-error
        const email = req?.user?.email;
        // TODO: validate email
        const sql = "SELECT * FROM User WHERE email = ?";
        const [results] = await db.query(sql, [email]);

        // result.length <= 0 is always false for SELECT queries in mysql2 (returns empty array)
        // @ts-expect-error
        if (results.length > 0) {
            // @ts-expect-error
            res.status(200).send(results[0]);
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send('Error querying the database');
    }
});

app.get('/api/user/:userID', passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const { userID } = req.params;
        const sql = "SELECT * FROM User WHERE userID = ?";
        const [results] = await db.query(sql, [userID]);

        // @ts-expect-error
        if (results.length > 0) {
            // @ts-expect-error
            res.status(200).send(results[0]);
        } else {
            res.status(404).send('User not found');
        }
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send('Error querying the database');
    }
});

app.post("/api/pusher/auth", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const socketId = req.body.socket_id;
    const channel: string = req.body.channel_name;

    // @ts-expect-error just give me the fucking email
    const email = req.user?.email;
    if (!email) {
        return res.status(401).send("Forbidden: No email associated with token.")
    }

    const user = await getUserFromEmail(email);
    if (!user) {
        return res.status(403).send("Forbidden: User with the email not found.")
    }

    const channelPrefixes = [
        'private-user-',
        'private-team-'
    ];

    const matchedPrefix = channelPrefixes.find(x => channel.startsWith(x));
    if (!matchedPrefix) {
        console.log("no?");
        return res.status(403).send('Forbidden: Unknown channel type');
    }
    const channelId = channel.substring(matchedPrefix.length);

    let isAuthorized = false;
    switch (matchedPrefix) {
        case "private-user-":
            isAuthorized = user.userID === channelId;
            break;
        case "private-team-":
            isAuthorized = user.teamID === Number(channelId);
            break;
        default:
            assert("unreachable");
    }

    if (!isAuthorized) {
        return res.status(403).send(`Forbidden: Channel ${channel} Mismatch`);
    }

    const authResponse = pusher.authorizeChannel(socketId, channel);
    res.send(authResponse);
});

// app.get('/api/test', async (req, res) => {
//     const [results] = await db.query("select * from test");
//     res.send(results);
// });

app.get('/api/getWorkers', passport.authenticate('jwt', { session: false }), async (req, res) => {
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
