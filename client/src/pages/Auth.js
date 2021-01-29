import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useHttp } from '../hooks/http.hook';

export const Auth = () => {
  const auth = useContext(AuthContext);
  const [form, setForm] = useState({ email: '', password: '' });
  const { loading, error, clearError, request } = useHttp();

  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value.replace(/\s/g, '') });
  };

  const handleLogin = async (e) => {
    try {
      e.preventDefault();
      const data = await request('/api/auth/login', 'POST', { ...form });
      auth.login(data.token, data.userId);
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
    <form className="m-3">
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="text"
          className="form-control"
          value={form.email}
          name="email"
          aria-describedby="emailHelp"
          placeholder="Email"
          onChange={handleInput}
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">Пароль</label>
        <input
          type="password"
          className="form-control"
          value={form.password}
          name="password"
          placeholder="Пароль"
          onChange={handleInput}
        />
      </div>
      <button
        type="submit"
        className="btn btn-success mr-3"
        onClick={handleLogin}
        disabled={loading}
      >
        Войти
      </button>
      <button
        type="submit"
        className="btn btn-outline-success"
        onClick={handleRegister}
        disabled={loading}
      >
        Зарегистрироваться
      </button>
    </form>
  );
};
