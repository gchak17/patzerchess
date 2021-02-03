import { router } from "./router.js";

window.addEventListener("popstate", () => {
  router();
});

document.addEventListener("DOMContentLoaded", () => {
  router();
});
