import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const Navbar = () => {
  const auth = useContext(AuthContext);

  const handleLogout = () => {
    auth.logout();
  };

  if (auth.token)
    return (
      <nav className="navbar navbar-light bg-light">
        <span className="navbar-brand mb-0 h1">TALKICO</span>
        <button
          class="btn btn-outline-success"
          type="button"
          onClick={handleLogout}
        >
          Выйти
        </button>
      </nav>
    );
  return (
    <nav className="navbar navbar-light bg-light">
      <span className="navbar-brand mb-0 h1">TALKICO</span>
    </nav>
  );
};
