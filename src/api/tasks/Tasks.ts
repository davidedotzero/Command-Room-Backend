import express from 'express';
import { db } from '../../db.js';
import type { QueryResult } from 'mysql2';
import { formatDateYYYY_MM_DD_Dashes, getBangkokDate, genSingleNewID } from '../../util.js';
import { formatInTimeZone } from 'date-fns-tz';
import passport from 'passport';
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


const parseWorkerString = (results: QueryResult) => {
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

router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const sql = `
            SELECT
                T.taskID, T.projectID, T.taskName, T.deadline, T.taskStatusID, T.teamHelpID,
                T.helpReqAt, T.helpReqReason, T.logPreview, T.createdAt, T.updatedAt, T.teamID,
                Team.teamName, TS.taskStatusName, TeamHelp.teamName as "teamHelpName", P.projectName,
                W.workersList as "workers",
                COALESCE(L.recentLogsCount, 0) as "recentLogsCount"
            FROM Task T
            JOIN Team ON T.teamID = Team.teamID
            JOIN TaskStatus TS ON T.taskStatusID = TS.taskStatusID
            JOIN Project P ON T.projectID = P.projectID
            LEFT JOIN Team as TeamHelp ON T.teamHelpID = TeamHelp.teamID
            LEFT JOIN (
                SELECT
                    TU.taskID,
                    GROUP_CONCAT(            
                        NULLIF(
                            CONCAT_WS(":", U.userID, U.userName, U.email, U.teamID, TeamUser.teamName, U.isAdmin),
                            ''
                        )
                        SEPARATOR ";"
                    ) as workersList
                FROM TaskUser TU    
                JOIN User U ON TU.userID = U.userID
                LEFT JOIN Team as TeamUser ON U.teamID = TeamUser.teamID
                GROUP BY TU.taskID
            ) W ON T.taskID = W.taskID

            LEFT JOIN (
                SELECT
                    taskID,
                    COUNT(eLogID) as recentLogsCount
                FROM EditLog
                WHERE date >= NOW() - INTERVAL 4 HOUR
                GROUP BY taskID
            ) L ON T.taskID = L.taskID;
        `;
        const [results] = await db.query(sql);
        const finalResult = parseWorkerString(results);
        res.send(finalResult);
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send('Error querying the database');
    }
});


router.get('/pid/:projectID', passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const { projectID } = req.params;
        const sql = `
            SELECT
                T.taskID, T.projectID, T.taskName, T.deadline, T.taskStatusID, T.teamHelpID,
                T.helpReqAt, T.helpReqReason, T.logPreview, T.createdAt, T.updatedAt, T.teamID,
                Team.teamName, TS.taskStatusName, TeamHelp.teamName as "teamHelpName", P.projectName,
                W.workersList as "workers",
                COALESCE(L.recentLogsCount, 0) as "recentLogsCount"
            FROM Task T
            JOIN Team ON T.teamID = Team.teamID
            JOIN TaskStatus TS ON T.taskStatusID = TS.taskStatusID
            JOIN Project P ON T.projectID = P.projectID
            LEFT JOIN Team as TeamHelp ON T.teamHelpID = TeamHelp.teamID
            LEFT JOIN (
                SELECT
                    TU.taskID,
                    GROUP_CONCAT(            
                        NULLIF(
                            CONCAT_WS(":", U.userID, U.userName, U.email, U.teamID, TeamUser.teamName, U.isAdmin),
                            ''
                        )
                        SEPARATOR ";"
                    ) as workersList
                FROM TaskUser TU    
                JOIN User U ON TU.userID = U.userID
                LEFT JOIN Team as TeamUser ON U.teamID = TeamUser.teamID
                GROUP BY TU.taskID
            ) W ON T.taskID = W.taskID

            LEFT JOIN (
                SELECT
                    taskID,
                    COUNT(eLogID) as recentLogsCount
                FROM EditLog
                WHERE date >= NOW() - INTERVAL 4 HOUR
                GROUP BY taskID
            ) L ON T.taskID = L.taskID

            WHERE T.projectID = ?
        `;
        const [results] = await db.query(sql, [projectID]);
        const finalResult = parseWorkerString(results);
        res.send(finalResult);
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send('Error querying the database');
    }
});


router.get('/uid/:userID', passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const { userID } = req.params;
        const sql = `
            SELECT
                T.taskID, T.projectID, T.taskName, T.deadline, T.taskStatusID, T.teamHelpID,
                T.helpReqAt, T.helpReqReason, T.logPreview, T.createdAt, T.updatedAt, T.teamID,
                Team.teamName, TS.taskStatusName, TeamHelp.teamName as "teamHelpName", P.projectName,
                W.workersList as "workers",
                COALESCE(L.recentLogsCount, 0) as "recentLogsCount"
            FROM Task T
            JOIN Team ON T.teamID = Team.teamID
            JOIN TaskStatus TS ON T.taskStatusID = TS.taskStatusID
            JOIN Project P ON T.projectID = P.projectID
            LEFT JOIN Team as TeamHelp ON T.teamHelpID = TeamHelp.teamID
            LEFT JOIN (
                SELECT
                    TU.taskID,
                    GROUP_CONCAT(            
                        NULLIF(
                            CONCAT_WS(":", U.userID, U.userName, U.email, U.teamID, TeamUser.teamName, U.isAdmin),
                            ''
                        )
                        SEPARATOR ";"
                    ) as workersList
                FROM TaskUser TU    
                JOIN User U ON TU.userID = U.userID
                LEFT JOIN Team as TeamUser ON U.teamID = TeamUser.teamID
                GROUP BY TU.taskID
            ) W ON T.taskID = W.taskID

            LEFT JOIN (
                SELECT
                    taskID,
                    COUNT(eLogID) as recentLogsCount
                FROM EditLog
                WHERE date >= NOW() - INTERVAL 4 HOUR
                GROUP BY taskID
            ) L ON T.taskID = L.taskID
            WHERE T.taskID IN (SELECT taskID FROM TaskUser WHERE TaskUser.userID = ?)
        `;
        const [results] = await db.query(sql, [userID]);
        const finalResult = parseWorkerString(results);
        res.send(finalResult);
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send('Error querying the database');
    }
});

router.post("/", passport.authenticate("jwt", { session: false }), async (req, res) => {
    try {
        const newTask = req.body;

        if (!newTask) {
            return res.status(400).send('Data is required.');
        }

        if (!Array.isArray(newTask)) {
            const sql = "INSERT INTO `Task`(`taskID`, `projectID`, `taskName`, `deadline`, `taskStatusID`, `teamHelpID`, `helpReqAt`, `helpReqReason`, `logPreview`, `createdAt`, `updatedAt`, `teamID`) VALUES (?,?,?,?,?,?,?,?,?,NOW(),?,?)"
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
        } else {
            throw new Error("ADDING MULTIPLE TASK RECORDS NOT IMPLEMENTED YET.");
        }

    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send('Error querying the database');
    }
});

router.put("/", passport.authenticate("jwt", { session: false }), async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const data = req.body;
        if (!data) return res.status(400).send({ message: 'Data is required.' });
        if (!data.updateTask) return res.status(400).send({ message: 'Data: updateTask is required.' });
        if (!data.newLog) return res.status(400).send({ message: 'Data: newLog is required.' });
        if (!data.toAddUsers) return res.status(400).send({ message: 'Data: toAddUsers is required.' });
        if (!data.toDelUsers) return res.status(400).send({ message: 'Data: toDelUsers is required.' });

        if (Array.isArray(data.updateData)) {
            throw new Error("Only allow updating one record at a time");
        }

        if (Array.isArray(data.newLog)) {
            throw new Error("ADDING MULTIPLE EDITLOG RECORDS NOT IMPLEMENTED YET.");
        }

        const taskID = data.updateTask.taskID;

        addNewTaskUsers: {
            if (!Array.isArray(data.toAddUsers) || data.toAddUsers.length <= 0) break addNewTaskUsers;
            // @ts-expect-error
            const newUserValues = data.toAddUsers.map(x => [taskID, x.userID]);
            const sql = "INSERT INTO `TaskUser`(`taskID`, `userID`) VALUES ?"
            const [result] = await db.query(sql, [newUserValues]);
        }

        delOldTaskUsers: {
            if (!Array.isArray(data.toDelUsers) || data.toDelUsers.length <= 0) break delOldTaskUsers;
            // @ts-expect-error
            const array = data.toDelUsers.map(x => [taskID, x.userID]);
            const whereClause = array.map(() => "(taskID = ? AND userID = ?)").join(' OR ');
            const delUserValues = array.flat();
            const sql2 = `DELETE FROM TaskUser WHERE ${whereClause}`;
            const [result2] = await db.execute(sql2, delUserValues);
        }

        addNewLogs: {
            const sql3 = "SELECT eLogID FROM EditLog ORDER BY date DESC LIMIT 1";
            const [results] = await db.execute(sql3);

            // @ts-expect-error
            if (results.length <= 0) {
                return res.status(404).send({ message: 'TODO: handle empty EditLog table. No editlogs found.' });
            }

            // @ts-expect-error
            const latest_id = results[0].eLogID;
            const new_elogid = genSingleNewID(latest_id);

            // because if fromDeadline or toDeadline is null javascript will parse it as the beginning of unix epoch FOR SOME FUCKING REASON. JUST THROW ME A FUCKING ERROR STOP TRYING TO BE "CLEVER" U IDIOT FUCK TRASH SHIT BITCH NIGERIA
            const insertingFromDeadline = data.newLog.fromDeadline == null ? null : getBangkokDate(new Date(data.newLog.fromDeadline));
            const insertingToDeadline = data.newLog.toDeadline == null ? null : getBangkokDate(new Date(data.newLog.toDeadline));

            const sql4 = `
                INSERT INTO EditLog(eLogID, date, reason, fromStatusID, toStatusID, fromDeadline, toDeadline, taskID, userID) VALUES 
                (?,NOW(),?,?,?,?,?,?,?)`
            const params_sql4 = [new_elogid, data.newLog.reason, data.newLog.fromStatusID, data.newLog.toStatusID, insertingFromDeadline, insertingToDeadline, data.newLog.taskID, data.newLog.userID];

            const [result4] = await db.query(sql4, params_sql4);
        }

        updateTask: {
            const sql5 = "UPDATE `Task` SET `taskName`=?,`deadline`=?,`taskStatusID`=?,`teamHelpID`=?,`helpReqAt`=?,`helpReqReason`=?,`logPreview`=?,`updatedAt`=NOW(),`teamID`=? WHERE taskID = ?"
            const params =
                [
                    data.updateTask.taskName,
                    getBangkokDate(new Date(data.updateTask.deadline)),
                    data.updateTask.taskStatusID,
                    data.updateTask.teamHelpID,
                    data.updateTask.helpReqAt === null ? null : getBangkokDate(new Date(data.updateTask.helpReqAt)),
                    data.updateTask.helpReqReason,
                    data.updateTask.logPreview,
                    data.updateTask.teamID,
                    taskID
                ];

            const [result] = await db.query(sql5, params);
        }

        res.status(201).send({ message: "อัปเดต Task สำเร็จ" });
        await connection.commit();
    } catch (err) {
        await connection.rollback();
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send({
            message: "Error updating Tasks via transaction.",
            detail: "" + err
        });
    } finally {
        connection.release();
    }
});

export default router;
