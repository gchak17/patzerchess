import view from "./view.js";
import { navigateTo } from "../router.js";

export default class extends view {
  constructor() {
    super();
    this.setTitle("Dashboard");
  }

  async render() {
    return `<div id="dashboard-page">
              <div class="section">
                <h2 id="username"></h2>
                <h2 id="rating"></h2>
                <button id="logout">logout</button>
              </div>
              <div class="section">
                <h2>History</h2>
                <ul id="history"></ul>
              </div>
              <div class="section">
                <h2>Play</h2>
                <button id="play">against friend</button>
                <button id="play-computer" disabled>against computer</button>
              </div>
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
        usernameTitle.innerHTML = `username: ${username}`;
        ratingTitle.innerHTML = `rating: ${rating}`;
      }

      const historyResponse = await fetch("/api/history", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      //console.log(historyResponse);

      const historyDiv = document.getElementById("history");
      historyDiv.innerHTML = "";
      const historyResponseJSON = await historyResponse.json();
      historyResponseJSON.forEach(({ rating, against, date }) => {
        if (rating > 0) {
          let li = document.createElement("li");
          let liText = document.createTextNode(
            `Gained ${rating} points against ${against} ${date}`
          );
          li.appendChild(liText);

          historyDiv.appendChild(li);
        } else {
          let li = document.createElement("li");
          let liText = document.createTextNode(
            `Lost ${rating * -1} points against ${against} ${date}`
          );
          li.appendChild(liText);

          historyDiv.appendChild(li);
        }
      });
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
