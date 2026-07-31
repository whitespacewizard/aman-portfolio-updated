(() => {
  "use strict";

  async function mountGrowthEngine(mount) {
    if (mount.dataset.qcgeMounted === "true") return;
    mount.dataset.qcgeMounted = "true";

    const source = mount.dataset.componentSrc || "components/quick-clean/growth-engine.html";

    try {
      const response = await fetch(source);
      if (!response.ok) throw new Error(`Component request failed with ${response.status}`);

      mount.innerHTML = await response.text();
      const root = mount.querySelector("[data-qc-growth-engine]");
      if (!root) throw new Error("Growth engine component root was not found.");
      if (typeof window.initQuickCleanGrowthEngine !== "function") throw new Error("Growth engine JavaScript has not loaded.");

      window.initQuickCleanGrowthEngine(root);
    } catch (error) {
      mount.innerHTML = '<p class="qcge-loader-error">The growth workflow could not be loaded.</p>';
      console.error(error);
    }
  }

  function start() {
    document.querySelectorAll("[data-qc-growth-engine-mount]").forEach(mountGrowthEngine);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
