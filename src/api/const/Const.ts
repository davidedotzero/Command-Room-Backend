import express from 'express';
import { db } from '../../db.js';
import passport from 'passport';
const router = express.Router();

router.get('/teams', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM Team");
        res.send(results);
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send('Error querying the database');
    }
});


router.get('/taskStatuses', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM TaskStatus");
        res.send(results);
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send('Error querying the database');
    }
});


router.get('/defaultTaskNames', passport.authenticate('jwt', { session: false }), async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM DefaultTaskName");
        res.send(results);
    } catch (err) {
        console.error(err);
        console.log(new Date().toISOString());
        console.log("=============================================================");
        res.status(500).send('Error querying the database');
    }
});

export default router;
