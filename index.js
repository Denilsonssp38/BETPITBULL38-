
// backend/index.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 4000;
const SECRET = 'betpitbull38_secret';

app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database('./db.sqlite');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    balance REAL DEFAULT 15.00
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT,
    game TEXT,
    amount REAL,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashed], function (err) {
    if (err) return res.status(400).json({ error: 'Usuário já existe' });
    const token = jwt.sign({ id: this.lastID }, SECRET);
    res.json({ token, balance: 15.00 });
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    const token = jwt.sign({ id: user.id }, SECRET);
    res.json({ token, balance: user.balance });
  });
});

function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Token necessário' });
  try {
    const data = jwt.verify(token, SECRET);
    req.userId = data.id;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

app.post('/bet', auth, (req, res) => {
  const { type, game, amount } = req.body;
  db.get('SELECT balance FROM users WHERE id = ?', [req.userId], (err, user) => {
    if (user.balance < amount) return res.status(400).json({ error: 'Saldo insuficiente' });
    db.run('INSERT INTO bets (user_id, type, game, amount) VALUES (?, ?, ?, ?)', [req.userId, type, game, amount], function (err) {
      db.run('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, req.userId]);
      res.json({ success: true, betId: this.lastID });
    });
  });
});

app.get('/bets', auth, (req, res) => {
  db.all('SELECT * FROM bets WHERE user_id = ?', [req.userId], (err, rows) => {
    res.json(rows);
  });
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
