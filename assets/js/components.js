(() => {
  "use strict";

  const loaderScriptUrl = document.currentScript?.src;

  if (!loaderScriptUrl) {
    console.error("Unable to resolve the global component loader path.");
    return;
  }

  const projectRootUrl = new URL("../../", loaderScriptUrl);

  function normalizeCurrentPageLinks(fragment) {
    const currentPath = window.location.pathname;
    const currentFile =
      currentPath.endsWith("/")
        ? "index.html"
        : currentPath.split("/").pop() || "index.html";

    fragment.querySelectorAll("a[href]").forEach((link) => {
      const rawHref = link.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#")) return;

      const [targetFile, targetHash] = rawHref.split("#");

      if (targetFile === currentFile && targetHash) {
        link.setAttribute("href", `#${targetHash}`);
      }
    });
  }

  async function loadComponent(placeholderId, componentFile) {
    const placeholder = document.getElementById(placeholderId);
    if (!placeholder) return;

    try {
      const componentUrl = new URL(`components/${componentFile}`, projectRootUrl);
      const response = await fetch(componentUrl);

      if (!response.ok) {
        throw new Error(
          `Unable to load ${componentFile}: HTTP ${response.status}`
        );
      }

      const template = document.createElement("template");
      template.innerHTML = (await response.text()).trim();

      normalizeCurrentPageLinks(template.content);
      placeholder.replaceWith(template.content);
    } catch (error) {
      console.error(error);
      placeholder.setAttribute("data-component-error", componentFile);
    }
  }

  function loadMainScript() {
    if (document.querySelector('script[data-main-script="true"]')) return;

    const mainScript = document.createElement("script");
    mainScript.src = new URL("main.js", loaderScriptUrl).href;
    mainScript.async = false;
    mainScript.dataset.mainScript = "true";
    document.body.appendChild(mainScript);
  }

  window.globalComponentsReady = Promise.all([
    loadComponent("global-menu", "menu.html"),
    loadComponent("global-footer", "footer.html"),
  ]).finally(loadMainScript);
})();
