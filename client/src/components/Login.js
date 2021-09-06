import React, { isValidElement, useEffect, useState } from "react";
import { Form, Button } from "react-bootstrap";
import validator from "validator";
import { loginUser } from "../services/user.service";

export function Login(props) {
  const [usernameMessage, setUsernameMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    validate();
  }, [username, password]);

  const validate = () => {
    let isValid = true;
    if (!validator.isAscii(password) && password.length > 3) {
      setPasswordMessage("Password is invalid");
      isValid = false;
    } else {
      setPasswordMessage("");
    }
    if (!validator.isAlphanumeric(username) && username.length > 3) {
      setUsernameMessage("Username is invalid");
      isValid = false;
    } else {
      setUsernameMessage("");
    }
    return isValid;
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    if (validate()) {
      loginUser(username, password).then((response) => {
        console.log(response);

        if (response) {
          if (response.status === 200) {
            alert("Success");
          } else {
            console.log(response);
            alert(response);
          }
        } else {
          alert("Nothing received from backend.");
        }
      });
    } else {
      alert("Error");
    }
  };

  return (
    <React.Fragment>
      <h1>Login</h1>

      <div class="d-flex ">
        <Form>
          <Form.Group
            controlId="formBasicUsername"
            style={{ marginTop: "10px" }}
          >
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="username"
              placeholder="Enter username"
              onChange={(e) => {
                handleUsernameChange(e);
              }}
            />
          </Form.Group>
          <Form.Text className="text-warning">{usernameMessage}</Form.Text>

          <Form.Group
            controlId="formBasicPassword"
            style={{ marginTop: "10px" }}
          >
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
              onChange={(e) => {
                handlePasswordChange(e);
              }}
            />
          </Form.Group>
          <Form.Text className="text-warning">{passwordMessage}</Form.Text>
          <br />
          <Button
            variant="primary"
            type="submit"
            onClick={(e) => {
              handleLoginClick(e);
            }}
          >
            Login
          </Button>
        </Form>
      </div>
    </React.Fragment>
  );
}
