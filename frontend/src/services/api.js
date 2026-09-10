const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/* ---------------------------------------------
   Generic API Request
--------------------------------------------- */

async function apiRequest(
  endpoint,
  options = {}
) {
  const token = localStorage.getItem("token");

  const headers = {
    ...options.headers,
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.detail ||
      data.message ||
      "Something went wrong"
    );
  }

  return data;
}


/* ---------------------------------------------
   Authentication
--------------------------------------------- */

export async function loginUser(
  email,
  password
) {
  const formData = new URLSearchParams();

  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(
    `${API_BASE_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: formData,
    }
  );

  let data;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Invalid email or password"
    );
  }

  if (data.access_token) {
    localStorage.setItem(
      "token",
      data.access_token
    );
  }

  return data;
}


/* ---------------------------------------------
   Register
--------------------------------------------- */

export async function registerUser(
  name,
  email,
  password
) {
  return apiRequest(
    "/auth/signup",
    {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    }
  );
}


/* ---------------------------------------------
   Crypto Prices
--------------------------------------------- */

export async function getLatestPrices() {
  return apiRequest(
    "/prices/latest"
  );
}


/* ---------------------------------------------
   Supported Coins
--------------------------------------------- */

export async function getCoins() {
  return apiRequest(
    "/prices/coins"
  );
}


/* ---------------------------------------------
   Historical Prices
--------------------------------------------- */

export async function getPriceHistory() {
  return apiRequest(
    "/prices/history"
  );
}


/* ---------------------------------------------
   Backend Health
--------------------------------------------- */

export async function checkBackendHealth() {
  return apiRequest(
    "/prices/health"
  );
}


/* ---------------------------------------------
   Logout
--------------------------------------------- */

export function logoutUser() {
  localStorage.removeItem("token");
}


/* ---------------------------------------------
   Token Helper
--------------------------------------------- */

export function getToken() {
  return localStorage.getItem(
    "token"
  );
}


/* ---------------------------------------------
   Authentication Status
--------------------------------------------- */

export function isAuthenticated() {
  return Boolean(
    localStorage.getItem("token")
  );
}