const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const pool = require('./db');
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

let currentUser = '';

app.post('/save-email', async (req, res) => {
  const { email } = req.body;
  await pool.query('INSERT INTO users (email) VALUES ($1) ON CONFLICT DO NOTHING', [email]);
  res.sendStatus(200);
});

app.get('/emails', async (req, res) => {
  const result = await pool.query('SELECT email FROM users');
  res.json(result.rows);
});

app.post('/set-user', (req, res) => {
  currentUser = req.body.email;
  res.sendStatus(200);
});

app.post('/save-questions', async (req, res) => {
  const { questionsText, checkboxStates } = req.body;
  const questions = questionsText.trim().split('\n');

  if (questions.length !== 30) return res.status(400).send('Exatamente 30 questões são obrigatórias.');

  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const number = i + 1;
    const cleanText = questions[i].replace(/^Questão \d+:\s*/, '');
    const isCorrect = !checkboxStates.includes(number.toString());
    await pool.query(
      'INSERT INTO questions (question, is_correct, email, in_date, simulator_id) VALUES ($1, $2, $3, $4, $5)',
      [cleanText, isCorrect, currentUser, now, number]
    );
  }

  res.sendStatus(200);
});

app.get('/summary', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM questions WHERE email = $1', [currentUser]);
  const total = rows.length;
  const simulators = total / 30;
  const incorrect = rows.filter(r => !r.is_correct).length;
  const correct = rows.filter(r => r.is_correct).length;
  const percent = ((correct / total) * 100).toFixed(2);

  const summary = await pool.query(`
    SELECT question, COUNT(*) as times,
    COUNT(*) FILTER (WHERE NOT is_correct) AS incorrect,
    COUNT(*) FILTER (WHERE is_correct) AS correct,
      MAX(CASE WHEN is_correct THEN in_date ELSE NULL END) as last_correct,
      MAX(CASE WHEN NOT is_correct THEN in_date ELSE NULL END) as last_wrong
    FROM questions
    WHERE email = $1
    GROUP BY question
    Order BY count(*) desc
  `, [currentUser]);

  res.json({ simulators, total, correct, incorrect, percent, questions: summary.rows });
});

app.listen(3000, () => console.log('Servidor rodando em http://localhost:3000'));
