import index from "./views/index.js";
import dashboard from "./views/dashboard.js";
import game from "./views/game.js";

const pathToRegex = (path) =>
  new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");

const getParams = (match) => {
  const values = match.result.slice(1);
  const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map(
    (result) => result[1]
  );

  return Object.fromEntries(
    keys.map((key, i) => {
      return [key, values[i]];
    })
  );
};

const router = async () => {
  const routes = [
    { path: "/", view: index },
    { path: "/dashboard", view: dashboard },
    { path: "/game/:id", view: game },
  ];

  const potentialMatches = routes.map((route) => {
    return {
      route: route,
      result: location.pathname.match(pathToRegex(route.path)),
    };
  });

  let match = potentialMatches.find(
    (potentialMatch) => potentialMatch.result !== null
  );

  if (!match) {
    match = {
      route: routes[0],
      result: [location.pathname],
    };
  }

  const view = new match.route.view(getParams(match));
  document.getElementById("app").innerHTML = await view.render();
  await view.afterRender();
};

const navigateTo = (url) => {
  history.pushState(null, null, url);
  router();
};

export { router, navigateTo };
