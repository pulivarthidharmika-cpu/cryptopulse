const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function loginUser(email, password) {
  const formData = new URLSearchParams();

  formData.append("username", email);
  formData.append("password", password);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(
      `${BASE_URL}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    let data;
    try {
      data = await response.json();
    } catch {
      data = { detail: `Server responded with status ${response.status}` };
    }

    if (!response.ok) {
      let detailMsg = "Login failed";
      if (typeof data?.detail === "string") {
        detailMsg = data.detail;
      } else if (Array.isArray(data?.detail)) {
        detailMsg = data.detail
          .map((item) => (typeof item === "string" ? item : item.msg || JSON.stringify(item)))
          .join(", ");
      }
      throw new Error(detailMsg);
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Login request timed out. Please verify your connection.");
    }
    throw err;
  }
}