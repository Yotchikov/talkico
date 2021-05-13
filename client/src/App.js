import { BrowserRouter as Router } from 'react-router-dom';
import { useRoutes } from './routes';
import { useAuth } from './hooks/auth.hook';
import { AuthContext } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Loading } from './components/Loading';

function App() {
  const { token, userId, login, logout, ready } = useAuth();
  const isAuthenticated = !!token;
  const routes = useRoutes(isAuthenticated);

  document.body.style = 'background: #F0F0F0;';

  if (!ready) {
    return <Loading />;
  }

  return (
    <AuthContext.Provider
      value={{ token, userId, login, logout, isAuthenticated }}
    >
      <Navbar />
      <Router>{routes}</Router>
    </AuthContext.Provider>
  );
}

export default App;
