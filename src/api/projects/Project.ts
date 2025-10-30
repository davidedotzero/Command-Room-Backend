import express from 'express';
import { db } from '../../db.js';
import { genMultipleNewID, genSingleNewID, genSingleNewShortID, formatDateYYYY_MM_DD_Dashes, getBangkokDate, getBangkokTimestamp } from '../../util.js';
import passport from 'passport';
const router = express.Router();

router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM Project");
        res.send(results);
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send('Error querying the database');
    }
});


router.get('/active/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const [results] = await db.query
            (`
                select Project.projectID, Project.projectName, count(Task.taskID) as recent7days from Project
                left join Task on Project.projectID = Task.projectID and Task.updatedAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                where Project.isArchived = FALSE 
                group by Project.projectID
                order by Project.createdAt desc; 
            `);
        res.send(results);
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send('Error querying the database');
    }
});

// TODO: change to /:projectID/name
router.get('/name/:projectID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { projectID } = req.params;
        const sql = "SELECT projectName FROM Project WHERE projectID = ? LIMIT 1";
        const [results] = await db.query(sql, [projectID]);

        // @ts-expect-error
        if (results.length > 0) {
            // @ts-expect-error
            res.send(results[0]);
        } else {
            res.status(404).send('Project not found');
        }
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send('Error querying the database');
    }
});

// TODO: change to /:projectID/name
router.patch('/name/:projectID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { projectID } = req.params;
        const projectName = req.body;

        const sql = "UPDATE `Project` SET `projectName`=? WHERE projectID=?"
        const [results] = await db.query(sql, [projectName.newProjectName, projectID]);

        res.status(201).send({ message: "อัปเดตชื่อโปรเจคสำเร็จ" });
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send({
            message: "Error updating project name.",
            detail: "" + err
        });
    }
});

// TODO: change to /:projectID/archive
router.patch('/archive/:projectID', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const { projectID } = req.params;
        const isArchived = req.body.isArchived;

        const sql = "UPDATE `Project` SET `isArchived`=? WHERE projectID=?"
        const [results] = await db.query(sql, [isArchived, projectID]);

        res.status(201).send({ message: "อัปเดตสถานะโปรเจคเป็น จัดเก็บ สำเร็จ" });
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send({
            message: "Error archiving project.",
            detail: "" + err
        });
    }
});

// add new project with tasks
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();
        const data = req.body;
        //TODO: validate req.body; data.tasks isArray etc.

        if (!data) {
            return res.status(400).send({ message: 'Data is required.' });
        }

        // get new projectID
        const sql = "SELECT projectID FROM Project ORDER BY createdAt DESC LIMIT 1";
        const [results] = await connection.execute(sql);
        // @ts-expect-error
        if (results.length <= 0) {
            return res.status(404).send({ message: 'TODO: handle empty project table. No project found.' });
        }
        // @ts-expect-error
        const latest_projectID = results[0].projectID;
        const new_projectID = genSingleNewShortID(latest_projectID);

        // TODO: check new_projectID valid with sql here

        // insert new project
        const sql2 = "INSERT INTO `Project`(`projectID`, `projectName`, `isArchived`, `createdAt`) VALUES (?,?,FALSE,NOW())"
        const [results2] = await connection.query(sql2, [new_projectID, data.projectName]);

        if (!data.tasks || data.tasks.length <= 0) {
            res.status(201).send({ message: "สร้างโปรเจกต์เปล่าสำเร็จ" });
            await connection.commit();
            return;
        }

        // get new taskIDs
        const sql3 = "SELECT taskID FROM Task ORDER BY createdAt DESC, taskID DESC LIMIT 1;";
        const [results3] = await connection.execute(sql3);
        // @ts-expect-error
        if (results3.length <= 0) {
            return res.status(404).send({ message: 'TODO: handle empty task table. No task found.' });
        }
        // @ts-expect-error
        const latest_taskID = results3[0].taskID;
        const new_taskIDs = genMultipleNewID(latest_taskID, data.tasks.length);
        // TODO: handle duplicate key
        console.log(new_taskIDs);

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
        const [results4] = await connection.query(sql4, [values])

        res.status(201).send({ message: "สร้างโปรเจกต์พร้อม Task สำเร็จ" });
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
