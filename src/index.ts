import express from 'express';
import cors from 'cors';
import { db } from './db.js';
// import type { FilteringTask } from './types.js';

const app = express();
const PORT: number = 8080;

app.use(cors());

app.listen(PORT, () => {
    console.log('The application is listening '
        + 'on port http://localhost/' + PORT);
});

app.get('/', (req, res) => {
    res.send('hello human!!! o/');
});

app.get('/api/verifyEmail/:email', (req, res) => {
    const email = req.params.email;
    db.query("select * from User where email = ?", email, (err, result) => {
        // TODO: BETTER ERROR HANDLING
        if (err) {
            res.send(res.errored);
        }
        if (result.length <= 0) {
            res.send(null);
        }

        res.send(result);
    })
});

app.get('/api/getTest', (req, res) => {
    db.query(
        "select * , JSON_ARRAYAGG( JSON_OBJECT('userID', User.userID, 'userName', User.userName) ) as yedhee from Task left join TaskUser on Task.taskID = TaskUser.taskID left join User on TaskUser.userID = User.userID left join Team as TeamUser on User.teamID = TeamUser.teamID where Task.taskID = \"TASK-20250912-000012\" and Task.taskID in ( select taskID from TaskUser where TaskUser.userID = \"USER-2025-000002\" ) group by Task.taskID; "
        , (err, result) => {
            // handle err properly
            if (err) {
                console.log(err);
            }

            console.log(result);
            res.send(result);
        });
});

app.get('/api/getAllTeams', (req, res) => {
    db.query("select * from Team", (err, result) => {
        // handle err properly
        if (err) {
            console.log(err);
        }

        res.send(result);
    })
});

app.get('/api/getAllTaskStatuses', (req, res) => {
    db.query("select * from TaskStatus", (err, result) => {
        // handle err properly
        if (err) {
            console.log(err);
        }

        res.send(result);
    })
});

app.get('/api/getAllDefaultTaskNames', (req, res) => {
    db.query("select * from DefaultTaskName", (err, result) => {
        // handle err properly
        if (err) {
            console.log(err);
        }

        res.send(result);
    })
});

app.get('/api/getAllProjects', (req, res) => {
    db.query("select * from Project", (err, result) => {
        // handle err properly
        if (err) {
            console.log(err);
        }

        res.send(result);
    })
});

app.get('/api/getAllActiveProjects', (req, res) => {
    db.query("select * from Project where isArchived = FALSE", (err, result) => {
        // handle err properly
        if (err) {
            console.log(err);
        }

        res.send(result);
    })
});

app.get('/api/getAllTasksDetailed', (req, res) => {
    db.query(`
        select 
            Task.taskID, 
            Task.projectID, 
            Task.taskName, 
            Task.deadline, 
            Task.taskStatusID, 
            Task.teamHelpID, 
            Task.helpReqAt, 
            Task.helpReqReason, 
            Task.logPreview, 
            Task.createdAt, 
            Task.updatedAt, 
            Task.teamID, 
            Team.teamName, 
            TaskStatus.taskStatusName, 
            TeamHelp.teamName as "teamHelpName", 
            GROUP_CONCAT(CONCAT_WS(":", User.userID, User.userName, User.email, User.teamID, TeamUser.teamName, User.isAdmin) SEPARATOR ";") as "workers" 
        from Task

        join Team on Task.teamID = Team.teamID
        join TaskStatus on Task.taskStatusID = TaskStatus.taskStatusID
        left join Team as TeamHelp on Task.teamHelpID = TeamHelp.teamID
        left join TaskUser on Task.taskID = TaskUser.taskID
        left join User on TaskUser.userID = User.userID
        left join Team as TeamUser on User.teamID = TeamUser.teamID

        group by Task.taskID;
    `,
        (err, result) => {
            if (err) {
                console.log(err);
            }

            const finalResult = result.map((row: any) => {
                if (row.workers) {
                    const workerArray = row.workers.split(';').map((workerStr: string) => {
                        const [userID, userName, email, teamID, teamName, isAdmin] = workerStr.split(':');
                        return { userID, userName, email, teamID, teamName, isAdmin };
                    });

                    return {
                        ...row,
                        workers: workerArray,
                        deadline: new Date(row.deadline),
                        createdAt: new Date(row.createdAt),
                        updatedAt: row.updatedAt !== null ? new Date(row.updatedAt) : null
                    };
                }

                return {
                    ...row,
                    workers: null,
                    deadline: new Date(row.deadline),
                    createdAt: new Date(row.createdAt),
                    updatedAt: row.updatedAt !== null ? new Date(row.updatedAt) : null
                };
            })

            res.send(finalResult);
        });
});

app.get('/api/getTasksByProjectIdDetailed/:projectID', (req, res) => {
    const projectID = req.params.projectID;

    db.query(`
        select 
            Task.taskID, 
            Task.projectID, 
            Task.taskName, 
            Task.deadline, 
            Task.taskStatusID, 
            Task.teamHelpID, 
            Task.helpReqAt, 
            Task.helpReqReason, 
            Task.logPreview, 
            Task.createdAt, 
            Task.updatedAt, 
            Task.teamID, 
            Team.teamName, 
            TaskStatus.taskStatusName, 
            TeamHelp.teamName as "teamHelpName", 
            GROUP_CONCAT(CONCAT_WS(":", User.userID, User.userName, User.email, User.teamID, TeamUser.teamName, User.isAdmin) SEPARATOR ";") as "workers" 
        from Task

        join Team on Task.teamID = Team.teamID
        join TaskStatus on Task.taskStatusID = TaskStatus.taskStatusID
        left join Team as TeamHelp on Task.teamHelpID = TeamHelp.teamID
        left join TaskUser on Task.taskID = TaskUser.taskID
        left join User on TaskUser.userID = User.userID
        left join Team as TeamUser on User.teamID = TeamUser.teamID

        where Task.projectID = (?)

        group by Task.taskID;
    `, projectID,
        (err, result) => {
            if (err) {
                console.log(err);
            }

            const finalResult = result.map((row: any) => {
                if (row.workers) {
                    const workerArray = row.workers.split(';').map((workerStr: string) => {
                        const [userID, userName, email, teamID, teamName, isAdmin] = workerStr.split(':');
                        return { userID, userName, email, teamID, teamName, isAdmin };
                    });

                    return {
                        ...row,
                        workers: workerArray,
                        deadline: new Date(row.deadline),
                        createdAt: new Date(row.createdAt),
                        updatedAt: row.updatedAt !== null ? new Date(row.updatedAt) : null
                    };
                }

                return {
                    ...row,
                    workers: null,
                    deadline: new Date(row.deadline),
                    createdAt: new Date(row.createdAt),
                    updatedAt: row.updatedAt !== null ? new Date(row.updatedAt) : null
                };
            })

            res.send(finalResult);
        });
});

app.get('/api/getAllUsersAsc', (req, res) => {
    // TODO: maybe we only need to get only userID and userName
    db.query("select * from User order by userName asc", (err, result) => {
        // handle err properly
        if (err) {
            console.log(err);
        }

        res.send(result);
    })
});

app.get('/api/getProjectNameById/:projectID', (req, res) => {
    const projectID = req.params.projectID;
    db.query("select projectName from Project where projectID = ? limit 1", projectID, (err, result) => {
        // handle err properly
        if (err) {
            console.log(err);
        }

        // TODO: response error when no project name found
        res.send(result[0]);
    })
});

app.get('/api/getLogsByTaskIdDesc/:taskID', (req, res) => {
    const taskID = req.params.taskID;

    db.query("select * from EditLog where taskID = (?) order by date desc", taskID, (err, result) => {
        if (err) {
            console.log(err);
        }

        res.send(result);
    })
});

app.get('/api/getTasksByUserIdDetailed/:userID', (req, res) => {
    const userID = req.params.userID;

    db.query(`
        select 
            Task.taskID, 
            Task.projectID, 
            Task.taskName, 
            Task.deadline, 
            Task.taskStatusID, 
            Task.teamHelpID, 
            Task.helpReqAt, 
            Task.helpReqReason, 
            Task.logPreview, 
            Task.createdAt, 
            Task.updatedAt, 
            Task.teamID, 
            Team.teamName, 
            TaskStatus.taskStatusName, 
            TeamHelp.teamName as "teamHelpName", 
            GROUP_CONCAT(CONCAT_WS(":", User.userID, User.userName, User.email, User.teamID, TeamUser.teamName, User.isAdmin) SEPARATOR ";") as "workers" 
        from Task

        join Team on Task.teamID = Team.teamID
        join TaskStatus on Task.taskStatusID = TaskStatus.taskStatusID
        left join Team as TeamHelp on Task.teamHelpID = TeamHelp.teamID
        left join TaskUser on Task.taskID = TaskUser.taskID
        left join User on TaskUser.userID = User.userID
        left join Team as TeamUser on User.teamID = TeamUser.teamID

        where Task.taskID in (
            select taskID from TaskUser where TaskUser.userID = (?)
        )

        group by Task.taskID;
    `, userID,
        (err, result) => {
            if (err) {
                console.log(err);
            }

            const finalResult = result.map((row: any) => {
                if (row.workers) {
                    const workerArray = row.workers.split(';').map((workerStr: string) => {
                        const [userID, userName, email, teamID, teamName, isAdmin] = workerStr.split(':');
                        return { userID, userName, email, teamID, teamName, isAdmin };
                    });

                    return {
                        ...row,
                        workers: workerArray,
                        deadline: new Date(row.deadline),
                        createdAt: new Date(row.createdAt),
                        updatedAt: row.updatedAt !== null ? new Date(row.updatedAt) : null
                    };
                }

                return {
                    ...row,
                    workers: null,
                    deadline: new Date(row.deadline),
                    createdAt: new Date(row.createdAt),
                    updatedAt: row.updatedAt !== null ? new Date(row.updatedAt) : null
                };
            })

            res.send(finalResult);
        });
});

app.get('/api/getLatestTaskID', (req, res) => {
    // TODO: fetch this from dedicated taskID table instead
    db.query("select taskID from Task order by createdAt desc limit 1;", (err, result) => {
        // handle err properly
        if (err) {
            console.log(err);
        }

        // TODO: response error when no project name found
        res.send(result[0]);
    })
});
