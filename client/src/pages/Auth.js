import React, { useState } from 'react';

export const Auth = () => {
  const [form, setForm] = useState({ email: '', password: '' });

  const handleInput = (e) => {
    setForm({ ...form, email: e.target.email, password: e.target.password });
  };

  const handleLogin = (e) => {
    
  }

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
          required
        />

        <label for="password">Password</label>
        <input
          type="password"
          placeholder="password"
          name="password"
          onChange={handleInput}
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
