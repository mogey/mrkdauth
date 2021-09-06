import axios from "axios";

export function registerUser(username, email, password) {
  return axios
    .post("/api/register", {
      username: username,
      password: password,
      email: email,
    })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      return error.response;
    });
}

export function loginUser(username, password) {
  return axios
    .post("/api/login", {
      username: username,
      password: password,
    })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      return error.response;
    });
}

export function logoutUser() {
  return axios
    .delete("/api/logout")
    .then((response) => {
      return response;
    })
    .catch((error) => {
      return error.response;
    });
}

export function verifyEmail(token) {
  return axios
    .post("/api/verifyEmail/" + token.toString())
    .then((response) => {
      return response;
    })
    .catch((error) => {
      return error.response;
    });
}

export function validateUser() {
  return axios
    .post("/api/validate")
    .then((response) => {
      if (response.data) {
        if (response.data.status) {
          if (response.data.status === "valid") {
            return true;
          } else {
            return false;
          }
        }
      }
    })
    .catch((error) => {
      if (!error.response) {
        return alert(error);
      }
      if (!error.response.data) {
        return alert(error);
      }
      if (!error.response.data.message) {
        if (error.response.data.status) {
          return alert(error.response.data.status);
        }
      }
      return alert(error.response.data.message);
    });
}
