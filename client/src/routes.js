import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { Auth } from './pages/Auth';
import { Room } from './pages/Room';
import { CreateRoom } from './pages/CreateRoom';

export const useRoutes = (isAuthenticated) => {
  if (isAuthenticated)
    return (
      <Switch>
        <Route path="/create" exact>
          <CreateRoom />
        </Route>
        <Route path="/room/:id">
          <Room />
        </Route>
        <Redirect to="/create" />
      </Switch>
    );
  return (
    <Switch>
      <Route path="/" exact>
        <Auth />
      </Route>
      <Redirect to="/" />
    </Switch>
  );
};
