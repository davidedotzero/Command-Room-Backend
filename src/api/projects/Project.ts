import express from 'express';
import { db } from '../../db.js';
import { genMultipleNewID, genSingleNewID, genSingleNewShortID, formatDateYYYY_MM_DD_Dashes, getBangkokDate, getBangkokTimestamp } from '../../util.js';
import passport from 'passport';
import { createProjectWithTasks } from './ProjectService.js';
import { createNotification } from '../notification/NotificationService.js';
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
            res.status(404).send({
                message: "Project not found",
                detail: ""
            });
        }
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send({
            message: "Error querying the database",
            detail: "" + err
        });
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

        const result = await createProjectWithTasks(data, connection);

        await connection.commit();
        res.status(201).send(result);
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
