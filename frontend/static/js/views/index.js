import { navigateTo } from "../router.js";
import view from "./view.js";

export default class extends view {
  constructor() {
    super();
    this.setTitle("Login or register");
  }

  async render() {
    return `<div id="login-register-page"> 
              <form id="login"> 
                <label>Login</label> 
                <input type="text" autocomplete="off" id="login-username" placeholder="Username" required minlength="6"/> 
                <input type="password" autocomplete="off" id="login-password" placeholder="Password" required minlength="6"/> 
                <input type="submit" value="Login"/> 
              </form> 
              <form id="register"> 
                <label>Register</label> 
                <input type="text" autocomplete="off" id="register-username" placeholder="Username" required minlength="6"/> 
                <input type="password" autocomplete="off" id="register-password" placeholder="Password" required minlength="6"/> 
                <input type="submit" value="Register"/> 
              </form> 
            </div>`;
  }

  async afterRender() {
    if (localStorage.getItem("token")) {
      navigateTo("/dashboard");
    }

    const authenticateUser = async (event, type) => {
      event.preventDefault();
      const username = document.getElementById(`${type}-username`).value;
      const password = document.getElementById(`${type}-password`).value;

      const response = await fetch(`/api/${type}`, {
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
        navigateTo("/dashboard");
      }
    };

    document
      .getElementById("register")
      .addEventListener("submit", (event) =>
        authenticateUser(event, "register")
      );

    document
      .getElementById("login")
      .addEventListener("submit", (event) => authenticateUser(event, "login"));
  }
}
