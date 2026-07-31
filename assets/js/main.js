(() => {
  "use strict";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const topMenu = document.querySelector(".top-menu-shell");
  const mobileToggle = document.querySelector(".mobile-menu-toggle");
  const mobilePanel = document.querySelector(".mobile-menu-panel");

  function closeMobileMenu() {
    if (!topMenu || !mobileToggle) return;

    topMenu.classList.remove("mobile-menu-open");
    mobileToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("mobile-menu-active");
  }

  if (topMenu && mobileToggle && mobilePanel) {
    mobileToggle.addEventListener("click", () => {
      const isOpen = topMenu.classList.contains("mobile-menu-open");

      if (isOpen) {
        closeMobileMenu();
      } else {
        topMenu.classList.remove("menu-hidden");
        topMenu.classList.add("mobile-menu-open");
        mobileToggle.setAttribute("aria-expanded", "true");
        document.body.classList.add("mobile-menu-active");
      }
    });

    mobilePanel.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMobileMenu();
    });

    document.addEventListener("click", (event) => {
      if (
        topMenu.classList.contains("mobile-menu-open") &&
        !topMenu.contains(event.target)
      ) {
        closeMobileMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMobileMenu();
        mobileToggle.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 720) closeMobileMenu();
    });
  }

  // Auto-hide navigation while scrolling down and reveal it while scrolling up.
  let previousScrollY = window.scrollY;
  let menuFrame = 0;

  function updateMenuVisibility() {
    if (!topMenu || topMenu.classList.contains("mobile-menu-open")) return;

    const currentScrollY = Math.max(window.scrollY, 0);
    const delta = currentScrollY - previousScrollY;

    if (currentScrollY <= 32 || delta < -3) {
      topMenu.classList.remove("menu-hidden");
    } else if (delta > 5) {
      topMenu.classList.add("menu-hidden");
    }

    previousScrollY = currentScrollY;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (menuFrame) return;

      menuFrame = window.requestAnimationFrame(() => {
        updateMenuVisibility();
        menuFrame = 0;
      });
    },
    { passive: true }
  );

  topMenu?.addEventListener("focusin", () => {
    topMenu.classList.remove("menu-hidden");
  });

  // Smooth only same-page anchor links. Cross-page links navigate normally.
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;

    const url = new URL(link.href, window.location.href);
    const samePage =
      url.origin === window.location.origin &&
      url.pathname === window.location.pathname;

    if (!samePage || !url.hash || url.hash === "#") return;

    const target = document.querySelector(url.hash);
    if (!target) return;

    event.preventDefault();
    closeMobileMenu();

    const menuOffset = window.innerWidth <= 720 ? 64 : 92;
    const destination =
      target.getBoundingClientRect().top +
      window.scrollY -
      menuOffset;

    window.scrollTo({
      top: Math.max(0, destination),
      behavior: reduceMotion ? "auto" : "smooth",
    });

    history.pushState(null, "", url.hash);
  });

  // Copy email button used on the homepage.
  const copyButton = document.getElementById("copy-email-button");
  const copyStatus = document.getElementById("copy-status");
  const emailAddress = "amanraj.gtm@gmail.com";

  if (copyButton && copyStatus) {
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(emailAddress);
      } catch (error) {
        const textArea = document.createElement("textarea");
        textArea.value = emailAddress;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }

      copyStatus.textContent = "Email copied.";

      window.setTimeout(() => {
        copyStatus.textContent = "";
      }, 2200);
    });
  }

  // Desktop-only wheel smoothing. Touch devices retain native scrolling.
  const useWheelSmoothing =
    !reduceMotion &&
    window.matchMedia("(pointer: fine)").matches &&
    window.innerWidth >= 900;

  if (useWheelSmoothing) {
    let currentY = window.scrollY;
    let targetY = window.scrollY;
    let animationFrame = 0;
    let programmaticScroll = false;

    const maximumScroll = () =>
      Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );

    function animateScroll() {
      const distance = targetY - currentY;
      currentY += distance * 0.13;

      if (Math.abs(distance) < 0.45) {
        currentY = targetY;
      }

      programmaticScroll = true;
      window.scrollTo(0, currentY);
      programmaticScroll = false;

      if (currentY !== targetY) {
        animationFrame = window.requestAnimationFrame(animateScroll);
      } else {
        animationFrame = 0;
      }
    }

    window.addEventListener(
      "wheel",
      (event) => {
        if (
          event.ctrlKey ||
          event.metaKey ||
          Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ) {
          return;
        }

        event.preventDefault();

        const delta =
          event.deltaMode === 1
            ? event.deltaY * 16
            : event.deltaMode === 2
              ? event.deltaY * window.innerHeight
              : event.deltaY;

        targetY = Math.min(
          maximumScroll(),
          Math.max(0, targetY + delta * 0.92)
        );

        if (!animationFrame) {
          currentY = window.scrollY;
          animationFrame = window.requestAnimationFrame(animateScroll);
        }
      },
      { passive: false }
    );

    window.addEventListener(
      "scroll",
      () => {
        if (!programmaticScroll && !animationFrame) {
          currentY = window.scrollY;
          targetY = window.scrollY;
        }
      },
      { passive: true }
    );

    window.addEventListener("resize", () => {
      currentY = Math.min(currentY, maximumScroll());
      targetY = Math.min(targetY, maximumScroll());
    });
  }
})();
