
// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:4000';

function App() {
  const [view, setView] = useState('login');
  const [token, setToken] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', amount: '', type: 'esporte', game: '' });
  const [bets, setBets] = useState([]);
  const [balance, setBalance] = useState(0);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const register = async () => {
    const res = await axios.post(`${API}/register`, form);
    setToken(res.data.token);
    setBalance(res.data.balance);
    setView('painel');
  };

  const login = async () => {
    const res = await axios.post(`${API}/login`, form);
    setToken(res.data.token);
    setBalance(res.data.balance);
    setView('painel');
  };

  const placeBet = async () => {
    await axios.post(`${API}/bet`, {
      type: form.type,
      game: form.game,
      amount: parseFloat(form.amount)
    }, { headers: { Authorization: token } });
    fetchBets();
  };

  const fetchBets = async () => {
    const res = await axios.get(`${API}/bets`, { headers: { Authorization: token } });
    setBets(res.data);
  };

  useEffect(() => {
    if (token) fetchBets();
  }, [token]);

  return (
    <div className="p-4 max-w-xl mx-auto">
      {view === 'login' && (
        <div>
          <h1 className="text-2xl font-bold">betPITBULL38 - Entrar</h1>
          <input name="username" placeholder="Usuário" onChange={handleChange} className="block my-2 w-full" />
          <input name="password" type="password" placeholder="Senha" onChange={handleChange} className="block my-2 w-full" />
          <button onClick={login} className="bg-blue-500 text-white px-4 py-2">Entrar</button>
          <button onClick={register} className="ml-2 text-blue-700">Criar conta</button>
        </div>
      )}

      {view === 'painel' && (
        <div>
          <h1 className="text-2xl font-bold mb-2">Bem-vindo à betPITBULL38</h1>
          <p className="mb-2">Saldo: R$ {balance.toFixed(2)}</p>
          <select name="type" onChange={handleChange} className="block my-2">
            <option value="esporte">Esportes</option>
            <option value="casino">Cassino</option>
          </select>
          <input name="game" placeholder="Jogo ou evento" onChange={handleChange} className="block my-2 w-full" />
          <input name="amount" type="number" placeholder="Valor da aposta" onChange={handleChange} className="block my-2 w-full" />
          <button onClick={placeBet} className="bg-green-600 text-white px-4 py-2">Apostar</button>
          <h2 className="text-xl mt-4">Suas Apostas</h2>
          <ul>
            {bets.map(bet => (
              <li key={bet.id}>{bet.type} - {bet.game} - R$ {bet.amount} ({bet.status})</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
