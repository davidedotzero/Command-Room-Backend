import express from 'express';
import cors from 'cors';
import { db } from './db.js';

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

app.get('/api/getTest', (req, res) => {
    db.query("select * from test", (err, result) => {
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
    db.query("select * from ")
});
