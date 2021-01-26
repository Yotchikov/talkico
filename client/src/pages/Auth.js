import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useHttp } from '../hooks/http.hook';

export const Auth = () => {
  const auth = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });
  const { loading, error, clearError, request } = useHttp();

  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    console.log(form);
  };

  const handleLogin = async (e) => {
    try {
      e.preventDefault();
      const data = await request('/api/auth/login', 'POST', { ...form });
      auth.login(data.token, data.userId)
    } catch (e) {
      alert(e.message);
    }
  };

  const handleRegister = async (e) => {
    try {
      e.preventDefault();
      const data = await request('/api/auth/register', 'POST', { ...form });
      alert(data.message);
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div>
      <h1>Auth Page</h1>
      <form>
        <label for="email">Email</label>
        <input
          type="text"
          placeholder="email"
          name="email"
          onChange={handleInput}
          disabled={loading}
          required
        />

        <label for="password">Password</label>
        <input
          type="password"
          placeholder="password"
          name="password"
          onChange={handleInput}
          disabled={loading}
          required
        />

        <button type="submit" onClick={handleLogin}>
          Войти
        </button>
        <button type="submit" onClick={handleRegister}>
          Зарегистрироваться
        </button>
      </form>
    </div>
  );
};
