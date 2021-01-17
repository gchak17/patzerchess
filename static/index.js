const registerForm = document.getElementById("register");

const registerUser = async (event) => {
  event.preventDefault();
  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;

  const response = await fetch("/api/register", {
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
    //TODO: show relevant message as popup
  } else {
    const { message } = await response.json();
    console.log(`Token: ${message}`);
    //TODO: show relevant message as popup, set token and navigate to another page
    localStorage.setItem("token", message);
    location.href = "/dashboard.html";
  }
};

registerForm.addEventListener("submit", registerUser);
