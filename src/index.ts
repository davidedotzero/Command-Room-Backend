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
        if (err) {
            console.log(err);
        }

        console.log(result);
        res.send(result);
    });
});

// app.get('/api/getAllTaskDetailed')
