const fetchDashboard = async () => {
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
    const { username, rating } = await response.json();
    const usernameTitle = document.getElementById("username");
    const ratingTitle = document.getElementById("rating");
    usernameTitle.innerHTML = username;
    ratingTitle.innerHTML = `rating: ${rating}`;
  }
};

fetchDashboard();

const logoutButton = document.getElementById("logout");
logoutButton.addEventListener("click", (e) => {
  localStorage.removeItem("token");
  location.href = "/";
});
