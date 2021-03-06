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
        <div className="container-fluid">
          <a href="/" className="navbar-brand mb-0 h1">
            AR Conference
          </a>
          <button
            className="btn btn-outline-primary"
            type="button"
            onClick={handleLogout}
          >
            Выйти
          </button>
        </div>
      </nav>
    );
  return (
    <nav className="navbar navbar-light bg-light">
      <div className="container-fluid">
        <a href="/" className="navbar-brand mb-0 h1">
          AR Conference
        </a>
      </div>
    </nav>
  );
};
