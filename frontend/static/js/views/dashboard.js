import view from "./view.js";
import { navigateTo } from "../router.js";

export default class extends view {
  constructor() {
    super();
    this.setTitle("Dashboard");
  }

  async render() {
    return `<div id="dashboard-page">
                <h2 id="username"></h2>
                <h2 id="rating"></h2>
                <h2 id="history"></h2>
                <button id="play">play</button>
                <button id="logout">logout</button>
            </div>`;
  }

  async afterRender() {
    if (!localStorage.getItem("token")) {
      navigateTo(`/`);
    }

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

    document.getElementById("logout").addEventListener("click", () => {
      localStorage.removeItem("token");
      navigateTo(`/`);
    });

    document.getElementById("play").addEventListener("click", () => {
      const requestPlay = async () => {
        const response = await fetch("/api/game", {
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
          navigateTo(`/game/${message}`);
        }
      };

      requestPlay();
    });
  }
}
