const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function loginUser(email, password) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Login backend error:", data);

    let message = "Login failed";

    if (typeof data.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data.detail)) {
      message = data.detail
        .map((error) => error.msg || JSON.stringify(error))
        .join("\n");
    } else if (data.message) {
      message = data.message;
    }

    throw new Error(message);
  }

  return data;
}