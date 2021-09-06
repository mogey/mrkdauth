import React, { isValidElement, useEffect, useState } from "react";
import { Form, Button } from "react-bootstrap";
import { useParams } from "react-router";
import validator from "validator";
import { loginUser, verifyEmail } from "../services/user.service";

export function VerifyEmail(props) {
  const [responseMessage, setResponseMessage] = useState();

  const { token } = useParams();

  useEffect(() => {
    if (token) {
      verifyEmail(token).then((response) => {
        if (!response) {
          setResponseMessage("Communication error");
          return;
        }
        if (response.status === 200) {
          setResponseMessage("Email was verified successfully!");
        } else {
          setResponseMessage("Service error");
        }
      });
    }
  }, []);

  return (
    <React.Fragment>
      <h1>Verify your email</h1>

      <div class="d-flex ">
        <Form>
          <Form.Group controlId="formVerifyToken" style={{ marginTop: "10px" }}>
            <Form.Label>Verification token</Form.Label>
            <Form.Control
              placeholder="Enter verification token"
              value={token}
            />
          </Form.Group>
          <Form.Text className="text-warning">{responseMessage}</Form.Text>
          <br />
          <Button variant="primary" type="submit" disabled>
            Verify
          </Button>
        </Form>
      </div>
    </React.Fragment>
  );
}
