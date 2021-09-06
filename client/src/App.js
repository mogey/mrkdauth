import { Register } from "./components/Register";
import { Container } from "react-bootstrap";
import { Login } from "./components/Login";
import { VerifyEmail } from "./components/VerifyEmail";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import React from "react";

function App() {
  return (
    <React.Fragment>
      <Router>
        <Switch>
          <Route path="/login">
            <Login />
          </Route>
          <Route path="/register">
            <Register />
          </Route>
          <Route path="/verifyEmail/:token">
            <VerifyEmail />
          </Route>
          <Route path="/verifyEmail/">
            <VerifyEmail />
          </Route>
          <Route path="/resetPassword/:token"></Route>
          <Route path="/">
            <Login />
          </Route>
        </Switch>
      </Router>
    </React.Fragment>
  );
}

export default App;
