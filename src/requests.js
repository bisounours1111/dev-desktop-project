export async function forgotPassword(email) {
  const response = await fetch("http://127.0.0.1:5000/forgotpassword", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
  return response.json();
}

export async function createUser(email, temp_password, firstName) {
  const response = await fetch("http://127.0.0.1:5000/createuser", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, temp_password, firstName }),
  });
  return response.json();
}
