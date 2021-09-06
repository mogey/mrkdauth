import React, { isValidElement, useEffect, useState } from "react";
import { Form, Button } from "react-bootstrap";
import validator from "validator";
import { registerUser } from "../services/user.service";

export function Register(props) {
  const [email, setEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [usernameMessage, setUsernameMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  useEffect(() => {
    validate();
  }, [email, username, password]);

  const validate = () => {
    let isValid = true;
    if (!validator.isEmail(email) && email.length > 3) {
      setEmailMessage("Email is invalid");
      isValid = false;
    } else {
      setEmailMessage("");
    }
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

  const handleRegisterClick = (e) => {
    e.preventDefault();
    if (validate()) {
      registerUser(username, email, password).then((response) => {
        console.log(response);
        if (response.status === 200 || response.status === 201) {
          alert("Success");
        } else {
          alert(response);
        }
      });
    } else {
      alert("Error");
    }
  };

  return (
    <React.Fragment>
      <h1>Register</h1>

      <div class="d-flex ">
        <Form>
          <Form.Group controlId="formBasicEmail" style={{ marginTop: "10px" }}>
            <Form.Label>Email address</Form.Label>
            <Form.Control
              type="email"
              placeholder="Enter email"
              onChange={(e) => {
                handleEmailChange(e);
              }}
            />
          </Form.Group>
          <Form.Text className="text-warning">{emailMessage}</Form.Text>

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
              handleRegisterClick(e);
            }}
          >
            Register
          </Button>
        </Form>
      </div>
    </React.Fragment>
  );
}
