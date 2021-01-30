if (localStorage.getItem("token")) {
  location.href = "/dashboard";
}

const registerForm = document.getElementById("register");
const loginForm = document.getElementById("login");

const authenticateUser = async (event, type) => {
  event.preventDefault();
  const username = document.getElementById(`${type}-username`).value;
  const password = document.getElementById(`${type}-password`).value;

  const response = await fetch(`/${type}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  if (!response.ok) {
    console.log("Bad response");
  } else {
    const { message } = await response.json();
    localStorage.setItem("token", message);
    location.href = "/dashboard";
  }
};

registerForm.addEventListener("submit", (event) =>
  authenticateUser(event, "register")
);

loginForm.addEventListener("submit", (event) =>
  authenticateUser(event, "login")
);
