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
    <div className="m-5 align-items-center text-center">
      <form style={{ width: '100%', maxWidth: '330px', margin: 'auto' }}>
        <h1>AR Conference</h1>
        <input
          type="text"
          className="form-control p-3"
          style={{
            marginBottom: '-1px',
            borderBottomRightRadius: 0,
            borderBottomLeftRadius: 0,
          }}
          value={form.email}
          name="email"
          aria-describedby="emailHelp"
          placeholder="Email"
          onChange={handleInput}
        />
        <input
          type="password"
          className="form-control p-3"
          style={{
            borderTopRightRadius: 0,
            borderTopLeftRadius: 0,
          }}
          value={form.password}
          name="password"
          placeholder="Пароль"
          onChange={handleInput}
        />
        <button
          type="submit"
          className="btn btn-primary btn-lg mt-3 m-1"
          onClick={handleLogin}
          disabled={loading}
        >
          Войти
        </button>
        <button
          type="submit"
          className="btn btn-outline-primary btn-lg mt-3 m-1"
          onClick={handleRegister}
          disabled={loading}
        >
          Зарегистрироваться
        </button>
      </form>
    </div>
  );
};
