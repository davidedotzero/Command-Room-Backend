import express from 'express';
import { db } from '../../db.js';
import { formatDateYYYY_MM_DD_Dashes } from '../../util.js';
const router = express.Router();

// router.post("/", async (req, res) => {
//     try {
//         const newTaskUsers = req.body;
//
//         if (!newTaskUsers) {
//             return res.status(400).send('Data is required.');
//         }
//
//         const taskID = newTaskUsers.taskID;
//         // @ts-expect-error
//         const values = newTaskUsers.users.map(x => [taskID, x.userID]);
//
//         const sql = "INSERT INTO `TaskUser`(`taskID`, `userID`) VALUES ?"
//         const [result] = await db.query(sql, [values]);
//         res.send(result);
//
//     } catch (err) {
//         console.error(err);
//         console.log(new Date().toISOString());
//         console.log("=============================================================");
//         res.status(500).send('Error querying the database');
//     }
// });
//
// router.delete("/", async (req, res) => {
//     try {
//         const delTaskUsers = req.body;
//
//         if (!delTaskUsers) {
//             return res.status(400).send('Data is required.');
//         }
//
//         const taskID = delTaskUsers.taskID;
//         // @ts-expect-error
//         const array = delTaskUsers.users.map(x => [taskID, x.userID]);
//
//         const whereClause = array.map(() => "(taskID = ? AND userID = ?)").join(' OR ');
//         const values = array.flat();
//
//         const sql = `DELETE FROM TaskUser WHERE ${whereClause}`;
//         // const formatsql = db.format(sql, values);
//         // console.log(formatsql);
//         const [result] = await db.query(sql, values);
//         res.send(result);
//
//         //         res.json({
//         //             message: 'Records deleted successfully',
//         //             affectedRows: result.affectedRows
//         //         });
//
//     } catch (err) {
//         console.error(err);
//         console.log(new Date().toISOString());
//         console.log("=============================================================");
//         res.status(500).send('Error querying the database');
//     }
// });

export default router;
