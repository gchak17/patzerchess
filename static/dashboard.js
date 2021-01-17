window.addEventListener("DOMContentLoaded", async (e) => {
  const response = await fetch("/api/dashboard", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      token: localStorage.getItem("token"),
    },
  });

  if (!response.ok) {
    console.log("Bad response");
  } else {
    const { username } = await response.json();
    const usernameTitle = document.getElementById("username-title");
    usernameTitle.innerHTML = username;
  }
});
