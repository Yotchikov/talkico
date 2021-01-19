import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';

export const useRoutes = (isAuthenticated) => {
  if (isAuthenticated)
    return (
      <Switch>
        <Route path="/"></Route>
      </Switch>
    );
  return <div>Goodbye</div>;
};
