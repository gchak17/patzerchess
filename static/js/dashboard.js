if (!localStorage.getItem("token")) {
  location.href = "/";
}

const fetchDashboard = async () => {
  const response = await fetch("/dashboard", {
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

const playButton = document.getElementById("play");
playButton.addEventListener("click", (e) => {
  const requestPlay = async () => {
    const response = await fetch("/game", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: localStorage.getItem("token"),
      },
    });

    if (!response.ok) {
      console.log("Bad response");
    } else {
      const { message } = await response.json();
      console.log(message);
      location.href = `/game/${message}`;
    }
  };

  requestPlay();
});
