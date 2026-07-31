window.initQuickCleanGrowthEngine = function initQuickCleanGrowthEngine(root) {
  if (!root || root.dataset.qcgeInitialised === "true") return;
  root.dataset.qcgeInitialised = "true";

  "use strict";

  const cv = root.querySelector("[data-qcge-canvas]");
  const mainCtx = cv.getContext("2d", { alpha: false });
  let ctx = mainCtx;

  const staticCanvas = document.createElement("canvas");
  const staticCtx = staticCanvas.getContext("2d", { alpha: false });
  let pixelRatio = 1;
  let cachedStage = -1;
  const playBtn = root.querySelector("[data-qcge-play]");
  const speedButtons = root.querySelectorAll("[data-qcge-speed]");
  const hoverTarget = root.querySelector(".qcge__stage") || cv;
  const DW = 1960;
  const DH = 1740;

  function fit() {
    const requestedRatio = window.devicePixelRatio || 1;
    pixelRatio = Math.min(requestedRatio, window.innerWidth < 760 ? 1 : 1.25);

    cv.width = Math.round(DW * pixelRatio);
    cv.height = Math.round(DH * pixelRatio);
    mainCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    staticCanvas.width = Math.round(DW * pixelRatio);
    staticCanvas.height = Math.round(DH * pixelRatio);
    staticCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    cachedStage = -1;
    renderStaticLayer(currentStage);
    renderFrame();
  }

  let resizeTimer = 0;
  function handleResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(fit, 120);
  }

  window.addEventListener("resize", handleResize, { passive: true });

  const C = {
    accent: "#FE4C1C",
    text: "#2b2b2b",
    muted: "#7a7a76",
    line: "#cfd0cb",
    softLine: "#deded9",
    canvas: "#f7f7f4",
    groupA: "#f2f2ef",
    groupB: "#ffffff",
    groupC: "#f2f2ef",
    linkedIn: "#0A66C2",
    gmail: "#EA4335",
    whatsapp: "#25D366",
    zoho: "#D9272E",
    apollo: "#5A64F0",
    green: "#4A7554",
    amber: "#B57B23",
    grey: "#777773"
  };

  const GROUPS = [
    { x: 54, y: 70, w: 1190, h: 370, title: "1 · Account research & qualification", fill: C.groupA, label: C.accent },
    { x: 54, y: 480, w: 770, h: 330, title: "2 · Contact discovery & enrichment", fill: C.groupB, label: C.text },
    { x: 860, y: 480, w: 1046, h: 330, title: "3 · Inbound & field sources", fill: C.groupA, label: C.accent },
    { x: 54, y: 850, w: 1852, h: 500, title: "4 · Signal-led outreach", fill: C.groupB, label: C.text },
    { x: 54, y: 1390, w: 1852, h: 310, title: "5 · Reply, nurture & sales handoff", fill: C.groupA, label: C.accent }
  ];

  const N = {};
  function node(id, x, y, icon, color, title, sub, type = "node", outs = 1, stage = 0) {
    N[id] = { id, x, y, icon, color, title, sub, type, outs, stage };
  }

  // Stage 1: account research and qualification
  node("a1", 135, 190, "claude", C.accent, "Claude", "research account rows", "node", 1, 0);
  node("a2", 285, 190, "gemini", "#4B69D1", "Gemini", "second-pass expansion", "node", 1, 0);
  node("a3", 435, 190, "directories", C.grey, "Directories", "associations · lists", "node", 1, 0);
  node("a4", 610, 190, "sheet", C.green, "Raw TAM sheet", "unverified accounts", "node", 1, 0);
  node("a5", 790, 190, "search", C.text, "Verification agent", "real, active and unique?", "agent", 2, 0);
  node("a6", 980, 190, "funnel", C.accent, "ICP / SAM agent", "fit before enrichment spend", "agent", 2, 0);
  node("a7", 1160, 190, "check", C.green, "Qualified list", "ready for contact discovery", "node", 1, 0);
  node("a8", 790, 300, "noop", C.grey, "Dropped", "invalid · duplicate", "node", 1, 0);
  node("a9", 980, 300, "noop", C.grey, "Outside ICP", "not a priority account", "node", 1, 0);

  // Stage 2: contact discovery and enrichment
  node("b1", 140, 600, "person", C.accent, "Stakeholder agent", "owner · GM · finance", "agent", 1, 1);
  node("b2", 335, 600, "apollo", C.apollo, "Waterfall enrichment", "Apollo → fallback sources", "agent", 1, 1);
  node("b3", 530, 600, "check", C.green, "Verify contact", "at point of send", "node", 2, 1);
  node("b4", 715, 600, "zoho", C.zoho, "Zoho CRM", "holding pool", "node", 1, 1);
  node("b5", 530, 740, "noop", C.grey, "No contact", "recheck later", "node", 1, 1);

  // Stage 3: inbound and field sources
  node("c1", 955, 535, "events", C.accent, "Events", "awards · exhibitions", "trigger", 1, 2);
  node("c2", 955, 625, "website", C.text, "Website enquiry", "inbound requirement", "trigger", 1, 2);
  node("c3", 955, 715, "linkedin", C.linkedIn, "LinkedIn", "Sales Navigator", "trigger", 1, 2);
  node("c4", 1160, 625, "switch", C.accent, "Source router", "route by context", "node", 3, 2);
  node("c5", 1365, 535, "sparkle", C.accent, "Event lead agent", "research + categorise", "agent", 1, 2);
  node("c6", 1365, 625, "sparkle", C.text, "Enquiry agent", "fit + intent in minutes", "agent", 1, 2);
  node("c7", 1365, 715, "linkedin", C.linkedIn, "Connect + DM", "low-volume personal", "node", 1, 2);
  node("c8", 1580, 625, "merge", C.grey, "Merge", "one CRM record", "node", 1, 2);

  // Stage 4: signal-led outreach
  node("d1", 145, 1010, "zoho", C.zoho, "CRM holding pool", "wait until a reason exists", "node", 1, 3);
  node("d2", 350, 1010, "signal", C.accent, "Signal watcher", "funding · hiring · visits", "agent", 1, 3);
  node("d3", 555, 1010, "branch", C.amber, "Signal fired?", "contact now or keep waiting", "node", 2, 3);
  node("d4", 750, 1010, "sparkle", C.accent, "Drafting agent", "writes to the signal", "agent", 1, 3);
  node("d5", 935, 1010, "person", C.text, "Human approval", "review sensitive drafts", "node", 1, 3);
  node("d6", 1125, 1010, "gauge", C.accent, "Deliverability governor", "health · caps · rotation", "governor", 1, 3);
  node("d7", 1320, 1010, "branch", C.amber, "Inbox healthy?", "send or hold", "node", 2, 3);
  node("d8", 1515, 1010, "loop", C.text, "Cadence loop", "6 touches across 18 days", "node", 4, 3);
  node("d9", 1715, 885, "gmail", C.gmail, "Gmail", "email touch", "node", 1, 3);
  node("d10", 1715, 975, "linkedin", C.linkedIn, "LinkedIn", "message touch", "node", 1, 3);
  node("d11", 1715, 1065, "whatsapp", C.whatsapp, "WhatsApp", "follow-up touch", "node", 1, 3);
  node("d12", 1715, 1155, "phone", C.text, "Call task", "sales follow-up", "node", 1, 3);
  node("d13", 1860, 1020, "hourglass", C.grey, "Wait", "gap between touches", "node", 1, 3);
  node("d14", 1320, 1260, "noop", C.grey, "Hold + rotate", "protect inbox health", "node", 1, 3);

  // Stage 5: reply, nurture and sales handoff
  node("e1", 150, 1525, "mail", C.gmail, "Reply trigger", "new response", "trigger", 1, 4);
  node("e2", 345, 1525, "sparkle", C.accent, "Reply triage", "confidence, not keywords", "agent", 1, 4);
  node("e3", 540, 1525, "switch", C.amber, "Route by intent", "hot · unclear · no · silent", "node", 4, 4);
  node("e4", 750, 1430, "calendar", C.green, "Book meeting", "qualified conversation", "node", 1, 4);
  node("e5", 750, 1525, "person", C.text, "Human review", "70–90% confidence", "node", 1, 4);
  node("e6", 750, 1620, "ban", C.grey, "Suppress", "not interested · opted out", "node", 1, 4);
  node("e7", 960, 1620, "leaf", C.accent, "Nurture", "case studies · webinars", "agent", 1, 4);
  node("e8", 960, 1430, "bell", C.green, "Notify sales", "SLA within 15 minutes", "node", 1, 4);
  node("e9", 1170, 1620, "hourglass", C.grey, "Wait 30 days", "until the next signal", "node", 1, 4);
  node("e10", 1170, 1430, "sales", C.text, "Sales team", "meeting on the calendar", "node", 1, 4);

  const SUBS = [
    { parent: "a5", x: 740, y: 390, icon: "website", color: C.text, title: "Web search", label: "Tool" },
    { parent: "a6", x: 1030, y: 390, icon: "website", color: C.accent, title: "Market signals", label: "Tool" },
    { parent: "b2", x: 285, y: 740, icon: "apollo", color: C.apollo, title: "Apollo", label: "Tool" },
    { parent: "b2", x: 380, y: 740, icon: "directories", color: C.grey, title: "Fallback", label: "Tool" },
    { parent: "d2", x: 350, y: 1280, icon: "signal", color: C.accent, title: "Signal sources", label: "Tool" },
    { parent: "d4", x: 750, y: 1280, icon: "claude", color: C.accent, title: "Claude", label: "Model" },
    { parent: "e2", x: 345, y: 1645, icon: "claude", color: C.accent, title: "Claude", label: "Model" }
  ];

  const EDGES = [];
  function edge(from, to, options = {}) {
    EDGES.push({ from, to, out: 0, outs: 1, ...options });
  }

  // Stage 1
  edge("a1", "a4"); edge("a2", "a4"); edge("a3", "a4");
  edge("a4", "a5");
  edge("a5", "a6", { out: 0, outs: 2, label: "valid" });
  edge("a5", "a8", { out: 1, outs: 2, label: "drop" });
  edge("a6", "a7", { out: 0, outs: 2, label: "fit" });
  edge("a6", "a9", { out: 1, outs: 2, label: "not now" });

  // Stage 1 to stage 2
  edge("a7", "b1", { via: [{ x: 1215, y: 190 }, { x: 1215, y: 455 }, { x: 105, y: 455 }, { x: 105, y: 600 }] });

  // Stage 2
  edge("b1", "b2"); edge("b2", "b3");
  edge("b3", "b4", { out: 0, outs: 2, label: "verified" });
  edge("b3", "b5", { out: 1, outs: 2, label: "missing" });

  // Stage 3
  edge("c1", "c4"); edge("c2", "c4"); edge("c3", "c4");
  edge("c4", "c5", { out: 0, outs: 3 });
  edge("c4", "c6", { out: 1, outs: 3 });
  edge("c4", "c7", { out: 2, outs: 3 });
  edge("c5", "c8"); edge("c6", "c8"); edge("c7", "c8");
  edge("c8", "b4", { via: [{ x: 1660, y: 625 }, { x: 1660, y: 825 }, { x: 760, y: 825 }, { x: 760, y: 600 }] });

  // Stage 2 to stage 4
  edge("b4", "d1", { via: [{ x: 755, y: 600 }, { x: 755, y: 825 }, { x: 110, y: 825 }, { x: 110, y: 1010 }] });

  // Stage 4
  edge("d1", "d2"); edge("d2", "d3");
  edge("d3", "d4", { out: 0, outs: 2, label: "yes" });
  edge("d3", "d1", { out: 1, outs: 2, label: "wait", via: [{ x: 605, y: 1010 }, { x: 605, y: 1325 }, { x: 112, y: 1325 }, { x: 112, y: 1034 }], loop: true });
  edge("d4", "d5"); edge("d5", "d6"); edge("d6", "d7");
  edge("d7", "d8", { out: 0, outs: 2, label: "healthy" });
  edge("d7", "d14", { out: 1, outs: 2, label: "hold" });
  edge("d8", "d9", { out: 0, outs: 4 });
  edge("d8", "d10", { out: 1, outs: 4 });
  edge("d8", "d11", { out: 2, outs: 4 });
  edge("d8", "d12", { out: 3, outs: 4 });
  edge("d9", "d13"); edge("d10", "d13"); edge("d11", "d13"); edge("d12", "d13");
  edge("d13", "d8", { via: [{ x: 1912, y: 1020 }, { x: 1912, y: 1325 }, { x: 1468, y: 1325 }, { x: 1468, y: 1034 }], loop: true });

  // Stage 4 to stage 5
  edge("d8", "e1", { via: [{ x: 1565, y: 1010 }, { x: 1565, y: 1370 }, { x: 108, y: 1370 }, { x: 108, y: 1525 }], note: "reply arrives" });

  // Stage 5
  edge("e1", "e2"); edge("e2", "e3");
  edge("e3", "e4", { out: 0, outs: 4, label: "hot" });
  edge("e3", "e5", { out: 1, outs: 4, label: "unclear" });
  edge("e3", "e6", { out: 2, outs: 4, label: "no" });
  edge("e3", "e7", { out: 3, outs: 4, label: "silent" });
  edge("e4", "e8"); edge("e8", "e10"); edge("e5", "e4"); edge("e7", "e9");
  edge("e9", "d1", { via: [{ x: 1220, y: 1620 }, { x: 1220, y: 1720 }, { x: 112, y: 1720 }, { x: 112, y: 1034 }], loop: true, note: "nurture returns to CRM" });
  edge("e10", "a6", { via: [{ x: 1220, y: 1430 }, { x: 1885, y: 1430 }, { x: 1885, y: 42 }, { x: 980, y: 42 }, { x: 980, y: 166 }], learn: true, note: "outcomes improve ICP" });

  const HALF_W = n => n.type === "trigger" ? 29 : 24;
  const HALF_H = 24;

  function roundRect(x, y, w, h, r, leftRadius = r) {
    const L = leftRadius;
    ctx.beginPath();
    ctx.moveTo(x + L, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + L, y + h);
    ctx.arcTo(x, y + h, x, y + h - L, L);
    ctx.lineTo(x, y + L);
    ctx.arcTo(x, y, x + L, y, L);
    ctx.closePath();
  }

  function orthogonalPath(points, radius) {
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length - 1; i++) {
      const p = points[i];
      const a = points[i - 1];
      const b = points[i + 1];
      const d1 = Math.hypot(a.x - p.x, a.y - p.y);
      const d2 = Math.hypot(b.x - p.x, b.y - p.y);
      const r = Math.min(radius, d1 / 2, d2 / 2);
      const u1 = { x: (a.x - p.x) / (d1 || 1), y: (a.y - p.y) / (d1 || 1) };
      const u2 = { x: (b.x - p.x) / (d2 || 1), y: (b.y - p.y) / (d2 || 1) };
      ctx.lineTo(p.x + u1.x * r, p.y + u1.y * r);
      ctx.quadraticCurveTo(p.x, p.y, p.x + u2.x * r, p.y + u2.y * r);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  function outputPort(n, index, total) {
    const spacing = total === 1 ? 0 : total === 2 ? 12 : 8.5;
    const y = total === 1 ? n.y : n.y + (index - (total - 1) / 2) * spacing * 2;
    return { x: n.x + HALF_W(n), y };
  }

  function inputPort(n) {
    return { x: n.x - HALF_W(n), y: n.y };
  }

  function edgePath(e) {
    const A = N[e.from];
    const B = N[e.to];
    const p0 = outputPort(A, e.out, e.outs);
    const p1 = inputPort(B);
    if (e.via) {
      orthogonalPath([p0, ...e.via, p1], 13);
    } else {
      const dx = Math.max(34, Math.abs(p1.x - p0.x) * 0.55);
      ctx.moveTo(p0.x, p0.y);
      ctx.bezierCurveTo(p0.x + dx, p0.y, p1.x - dx, p1.y, p1.x, p1.y);
    }
    return { p0, p1 };
  }

  function icon(name, x, y, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.7;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const B = () => ctx.beginPath();
    const S = () => ctx.stroke();
    const F = () => ctx.fill();

    switch (name) {
      case "claude":
        for (let i = 0; i < 6; i++) {
          const a = i * Math.PI / 3;
          B(); ctx.moveTo(Math.cos(a) * 2, Math.sin(a) * 2); ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9); S();
        }
        B(); ctx.arc(0, 0, 2.2, 0, Math.PI * 2); F();
        break;
      case "gemini":
        B(); ctx.moveTo(0, -9); ctx.bezierCurveTo(1, -3, 3, -1, 9, 0); ctx.bezierCurveTo(3, 1, 1, 3, 0, 9); ctx.bezierCurveTo(-1, 3, -3, 1, -9, 0); ctx.bezierCurveTo(-3, -1, -1, -3, 0, -9); F();
        break;
      case "directories":
        for (let r = -1; r <= 1; r += 2) for (let c = -1; c <= 1; c += 2) { roundRect(c * 4.7 - 2.4, r * 4.7 - 2.4, 4.8, 4.8, 1.2); F(); }
        break;
      case "sheet":
        B(); ctx.rect(-8, -8, 16, 16); S(); B(); ctx.moveTo(-8, -2.5); ctx.lineTo(8, -2.5); ctx.moveTo(-8, 3); ctx.lineTo(8, 3); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.lineWidth = 1.2; S();
        break;
      case "search":
        B(); ctx.arc(-1.5, -1.5, 6.2, 0, Math.PI * 2); S(); B(); ctx.moveTo(3.2, 3.2); ctx.lineTo(8, 8); S();
        break;
      case "funnel":
        B(); ctx.moveTo(-8, -6.5); ctx.lineTo(8, -6.5); ctx.lineTo(2, 1); ctx.lineTo(2, 8); ctx.lineTo(-2, 5.5); ctx.lineTo(-2, 1); ctx.closePath(); S();
        break;
      case "check":
        B(); ctx.arc(0, 0, 8.4, 0, Math.PI * 2); ctx.lineWidth = 1.4; S(); B(); ctx.lineWidth = 1.9; ctx.moveTo(-4, .3); ctx.lineTo(-1, 3.4); ctx.lineTo(4.4, -3.2); S();
        break;
      case "noop":
        B(); ctx.moveTo(-6.5, -5); ctx.lineTo(-1, 0); ctx.lineTo(-6.5, 5); S(); B(); ctx.moveTo(1, -5); ctx.lineTo(6.5, 0); ctx.lineTo(1, 5); S();
        break;
      case "person":
        B(); ctx.arc(0, -3.6, 3.7, 0, Math.PI * 2); S(); B(); ctx.moveTo(-7, 8); ctx.quadraticCurveTo(-7, 1.4, 0, 1.4); ctx.quadraticCurveTo(7, 1.4, 7, 8); S();
        break;
      case "apollo":
        B(); ctx.arc(0, 0, 8, -.35, Math.PI * 1.55); S(); B(); ctx.moveTo(2, -7); ctx.lineTo(8, -8); ctx.lineTo(6, -2); S();
        break;
      case "zoho":
        roundRect(-8, -8, 16, 16, 3); S(); ctx.font = '700 9px "Clash Grotesk", sans-serif'; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("Z", 0, .5); break;
      case "events":
        roundRect(-8, -7, 16, 15, 3); S(); B(); ctx.moveTo(-8, -2); ctx.lineTo(8, -2); ctx.moveTo(-4, -9); ctx.lineTo(-4, -5); ctx.moveTo(4, -9); ctx.lineTo(4, -5); S();
        break;
      case "website":
        B(); ctx.arc(0, 0, 8, 0, Math.PI * 2); S(); B(); ctx.ellipse(0, 0, 3.5, 8, 0, 0, Math.PI * 2); S(); B(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); S();
        break;
      case "linkedin":
        roundRect(-8, -8, 16, 16, 3); F(); ctx.fillStyle = "#fff"; ctx.font = "700 8px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("in", 0, .5); break;
      case "switch":
        for (let i = -1; i < 2; i++) { B(); ctx.moveTo(-8, i * 5.5); ctx.lineTo(4, i * 5.5); S(); B(); ctx.moveTo(1.5, i * 5.5 - 2.6); ctx.lineTo(4.6, i * 5.5); ctx.lineTo(1.5, i * 5.5 + 2.6); S(); }
        break;
      case "sparkle":
        B(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(1.4, -1.6, 9, 0); ctx.quadraticCurveTo(1.4, 1.6, 0, 9); ctx.quadraticCurveTo(-1.4, 1.6, -9, 0); ctx.quadraticCurveTo(-1.4, -1.6, 0, -9); F();
        break;
      case "merge":
        B(); ctx.moveTo(-8, -5); ctx.quadraticCurveTo(0, -5, 0, 0); ctx.moveTo(-8, 5); ctx.quadraticCurveTo(0, 5, 0, 0); ctx.lineTo(8, 0); S();
        break;
      case "signal":
        B(); ctx.arc(0, 0, 2, 0, Math.PI * 2); F(); for (const r of [5, 9]) { B(); ctx.arc(0, 0, r, -.8, .8); S(); }
        break;
      case "branch":
        B(); ctx.moveTo(-8, 0); ctx.lineTo(-2, 0); S(); B(); ctx.moveTo(-2, 0); ctx.quadraticCurveTo(2, 0, 2, -5.5); ctx.lineTo(8, -5.5); S(); B(); ctx.moveTo(-2, 0); ctx.quadraticCurveTo(2, 0, 2, 5.5); ctx.lineTo(8, 5.5); S(); B(); ctx.arc(-2, 0, 1.6, 0, Math.PI * 2); F();
        break;
      case "gauge":
        B(); ctx.arc(0, 3, 8, Math.PI, Math.PI * 2); S(); B(); ctx.moveTo(0, 3); ctx.lineTo(5, -2.5); S(); B(); ctx.arc(0, 3, 1.7, 0, Math.PI * 2); F();
        break;
      case "loop":
        B(); ctx.arc(0, 0, 7.6, -.5, 4.9); S(); B(); ctx.moveTo(4, -7.6); ctx.lineTo(7.4, -5.6); ctx.lineTo(8, -9.4); ctx.closePath(); F();
        break;
      case "gmail":
      case "mail":
        B(); ctx.rect(-8.5, -6, 17, 12); S(); B(); ctx.moveTo(-8.5, -6); ctx.lineTo(0, 1.5); ctx.lineTo(8.5, -6); ctx.lineWidth = 1.4; S();
        break;
      case "whatsapp":
        B(); ctx.arc(0, -1, 7.5, 0, Math.PI * 2); S(); B(); ctx.moveTo(-4, 5); ctx.lineTo(-7, 9); ctx.lineTo(-1, 7); S(); B(); ctx.arc(-1, -1, 3, -1.1, 1.1); S();
        break;
      case "phone":
        B(); ctx.moveTo(-7, -7.5); ctx.quadraticCurveTo(-3.5, -8.5, -2, -5.5); ctx.lineTo(-.5, -2.5); ctx.quadraticCurveTo(0, -1.2, -1.2, -.2); ctx.lineTo(-2.6, 1); ctx.quadraticCurveTo(-1, 4.5, 2, 6.6); ctx.lineTo(3.4, 5.4); ctx.quadraticCurveTo(4.6, 4.4, 5.8, 5.2); ctx.lineTo(8.4, 7); ctx.quadraticCurveTo(10.5, 8.6, 8, 9.5); ctx.quadraticCurveTo(-2, 9, -7, -7.5); S();
        break;
      case "hourglass":
        B(); ctx.moveTo(-6.5, -8); ctx.lineTo(6.5, -8); ctx.lineTo(-6.5, 8); ctx.lineTo(6.5, 8); ctx.closePath(); S();
        break;
      case "calendar":
        B(); ctx.rect(-8, -6.5, 16, 14.5); S(); B(); ctx.moveTo(-8, -2); ctx.lineTo(8, -2); ctx.moveTo(-4, -9.5); ctx.lineTo(-4, -4.5); ctx.moveTo(4, -9.5); ctx.lineTo(4, -4.5); S();
        break;
      case "ban":
        B(); ctx.arc(0, 0, 8.2, 0, Math.PI * 2); S(); B(); ctx.moveTo(-5.6, -5.6); ctx.lineTo(5.6, 5.6); S();
        break;
      case "leaf":
        B(); ctx.moveTo(-7, 7); ctx.quadraticCurveTo(-8, -6, 8, -8); ctx.quadraticCurveTo(8, 7, -7, 7); ctx.closePath(); S(); B(); ctx.moveTo(-7, 7); ctx.quadraticCurveTo(0, 2, 5, -3.5); ctx.lineWidth = 1.3; S();
        break;
      case "bell":
        B(); ctx.moveTo(-7, 4); ctx.quadraticCurveTo(-5, 4, -5, -1); ctx.quadraticCurveTo(-5, -8, 0, -8); ctx.quadraticCurveTo(5, -8, 5, -1); ctx.quadraticCurveTo(5, 4, 7, 4); ctx.closePath(); S();
        break;
      case "sales":
        roundRect(-8, -6, 16, 13, 2); S(); B(); ctx.moveTo(-3, -6); ctx.lineTo(-3, -9); ctx.lineTo(3, -9); ctx.lineTo(3, -6); S();
        break;
    }
    ctx.restore();
  }

  function drawBackground() {
    ctx.fillStyle = C.canvas;
    ctx.fillRect(0, 0, DW, DH);
    ctx.fillStyle = "rgba(43,43,43,.060)";
    for (let x = 14; x < DW; x += 24) {
      for (let y = 14; y < DH; y += 24) ctx.fillRect(x, y, 1.2, 1.2);
    }
  }

  function drawGroups(activeStage) {
    GROUPS.forEach((g, i) => {
      ctx.save();
      roundRect(g.x, g.y, g.w, g.h, 13);
      ctx.fillStyle = g.fill;
      ctx.fill();
      ctx.strokeStyle = i === activeStage ? "rgba(254,76,28,.38)" : "rgba(43,43,43,.10)";
      ctx.lineWidth = i === activeStage ? 1.5 : 1;
      ctx.stroke();
      ctx.restore();

      ctx.font = '600 12px "Clash Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = g.label;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(g.title, g.x + 17, g.y + 26);
    });
  }

  function drawStaticEdges() {
    ctx.lineCap = "round";

    EDGES.forEach(e => {
      ctx.beginPath();
      edgePath(e);
      ctx.strokeStyle = e.learn ? "rgba(74,117,84,.28)" : e.loop ? "rgba(181,123,35,.24)" : "rgba(43,43,43,.18)";
      ctx.lineWidth = 1.35;
      ctx.stroke();
    });

    EDGES.forEach(e => {
      const A = N[e.from];
      const B = N[e.to];
      const p0 = outputPort(A, e.out, e.outs);
      const p1 = inputPort(B);

      ctx.beginPath();
      ctx.arc(p0.x, p0.y, 2.8, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = e.learn ? C.green : "#a6a8a2";
      ctx.lineWidth = 1.3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(p1.x - 6.2, p1.y - 3.4);
      ctx.lineTo(p1.x - 1, p1.y);
      ctx.lineTo(p1.x - 6.2, p1.y + 3.4);
      ctx.closePath();
      ctx.fillStyle = e.learn ? C.green : e.loop ? C.amber : "#8f918c";
      ctx.fill();

      if (e.label) {
        ctx.font = '500 8.4px "Clash Grotesk", sans-serif';
        ctx.fillStyle = "#8a8a86";
        ctx.textAlign = "left";
        ctx.fillText(e.label, p0.x + 6, p0.y - 5);
      }

      if (e.note && e.via && e.via.length >= 3) {
        const a = e.via[1];
        const b = e.via[2];
        const tx = (a.x + b.x) / 2;
        const ty = a.y;
        ctx.save();
        ctx.translate(tx, ty);
        if (Math.abs(a.x - b.x) < 4) ctx.rotate(-Math.PI / 2);
        ctx.font = '500 9px "Clash Grotesk", sans-serif';
        ctx.fillStyle = e.learn ? C.green : e.loop ? C.amber : C.muted;
        ctx.textAlign = "center";
        ctx.fillText(e.note, 0, -7);
        ctx.restore();
      }
    });
  }

  function drawAnimatedEdges(offset) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.setLineDash([6, 11]);
    ctx.lineDashOffset = offset;

    EDGES.forEach(e => {
      ctx.beginPath();
      edgePath(e);
      ctx.strokeStyle = e.learn ? "#4A7554" : e.loop ? "#B57B23" : "#8f918c";
      ctx.lineWidth = 1.25;
      ctx.stroke();
    });

    ctx.restore();
  }

  function drawSubLinks() {
    ctx.save();
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = "#b8b9b4";
    ctx.lineWidth = 1.1;
    SUBS.forEach(s => {
      const p = N[s.parent];
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + HALF_H);
      ctx.bezierCurveTo(p.x, p.y + HALF_H + 25, s.x, s.y - 39, s.x, s.y - 17);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawSubNodes() {
    SUBS.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, 17, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.strokeStyle = "rgba(43,43,43,.18)";
      ctx.lineWidth = 1.05;
      ctx.stroke();
      ctx.save(); ctx.translate(s.x, s.y); ctx.scale(.78, .78); icon(s.icon, 0, 0, s.color); ctx.restore();
      ctx.textAlign = "center";
      ctx.font = '500 9px "Clash Grotesk", sans-serif';
      ctx.fillStyle = "#8a8a86";
      ctx.fillText(s.title, s.x, s.y + 30);
      if (s.label) {
        ctx.font = '500 7.8px "Clash Grotesk", sans-serif';
        ctx.fillStyle = "#aaa9a4";
        ctx.fillText(s.label.toUpperCase(), s.x, s.y + 41);
      }
    });
  }

  function drawNode(n, activeStage) {
    const w = n.type === "trigger" ? 58 : 48;
    const h = 48;
    const x = n.x - HALF_W(n);
    const y = n.y - HALF_H;

    ctx.save();
    roundRect(x, y, w, h, 10, n.type === "trigger" ? 24 : 10);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.strokeStyle = n.stage === activeStage ? "rgba(254,76,28,.52)" : "rgba(43,43,43,.16)";
    ctx.lineWidth = n.stage === activeStage ? 1.45 : 1.05;
    ctx.stroke();
    ctx.restore();

    if (n.type === "trigger") {
      icon("signal", x + 14, n.y, "#aaa9a4");
      ctx.beginPath(); ctx.moveTo(x + 28, y + 7); ctx.lineTo(x + 28, y + h - 7); ctx.strokeStyle = "#ecece8"; ctx.lineWidth = 1; ctx.stroke();
      icon(n.icon, x + 43, n.y, n.color);
    } else {
      icon(n.icon, n.x, n.y, n.color);
    }

    ctx.textAlign = "center";
    ctx.font = '600 10.8px "Clash Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = C.text;
    ctx.fillText(n.title, n.x, n.y + HALF_H + 16);
    if (n.sub) {
      ctx.font = '450 8.9px "Clash Grotesk", sans-serif';
      ctx.fillStyle = "#969691";
      ctx.fillText(n.sub, n.x, n.y + HALF_H + 29);
    }

    if (n.type === "agent" || n.type === "governor") {
      const bx = n.x + HALF_W(n) - 6;
      const by = n.y - HALF_H - 2;
      ctx.beginPath(); ctx.arc(bx, by, 7.3, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.fill();
      ctx.strokeStyle = n.type === "governor" ? C.accent : C.text;
      ctx.lineWidth = 1.2; ctx.stroke();
      ctx.font = '700 8px "Clash Grotesk", sans-serif';
      ctx.fillStyle = n.type === "governor" ? C.accent : C.text;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(n.type === "governor" ? "⛨" : "◈", bx, by + .3);
      ctx.textBaseline = "alphabetic";
    }
  }

  let running = true;
  let speed = 1;
  let offset = 0;
  let last = performance.now();
  let elapsed = 0;
  let currentStage = 0;
  let animationFrameId = 0;
  let isComponentVisible = false;
  let isPageVisible = !document.hidden;
  let isHovering = false;
  let lastPaint = 0;

  const FRAME_INTERVAL = 1000 / 30;

  function renderStaticLayer(activeStage) {
    if (cachedStage === activeStage && staticCanvas.width) return;

    const previousContext = ctx;
    ctx = staticCtx;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, DW, DH);

    drawBackground();
    drawGroups(activeStage);
    drawStaticEdges();
    drawSubLinks();
    drawSubNodes();
    Object.values(N).forEach(n => drawNode(n, activeStage));

    ctx = previousContext;
    cachedStage = activeStage;
  }

  function renderFrame() {
    renderStaticLayer(currentStage);

    mainCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    mainCtx.clearRect(0, 0, DW, DH);
    mainCtx.drawImage(staticCanvas, 0, 0, DW, DH);

    const previousContext = ctx;
    ctx = mainCtx;
    drawAnimatedEdges(offset);
    ctx = previousContext;
  }

  function stopLoop() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = 0;
    }
  }

  function shouldAnimate() {
    return running && isComponentVisible && isPageVisible && isHovering;
  }

  function startLoop() {
    if (!shouldAnimate() || animationFrameId) return;
    last = performance.now();
    lastPaint = 0;
    animationFrameId = requestAnimationFrame(frame);
  }

  function frame(now) {
    animationFrameId = 0;
    if (!root.isConnected || !shouldAnimate()) return;

    const dt = Math.min((now - last) / 1000, .05);
    last = now;
    offset -= dt * 34 * speed;
    elapsed += dt * speed;

    const nextStage = Math.floor(elapsed / 3.8) % GROUPS.length;
    if (nextStage !== currentStage) {
      currentStage = nextStage;
      cachedStage = -1;
    }

    if (!lastPaint || now - lastPaint >= FRAME_INTERVAL) {
      renderFrame();
      lastPaint = now;
    }

    animationFrameId = requestAnimationFrame(frame);
  }

  function enterHoverMode() {
    isHovering = true;
    if (shouldAnimate()) startLoop();
  }

  function leaveHoverMode() {
    isHovering = false;
    stopLoop();
    renderFrame();
  }

  hoverTarget.addEventListener("pointerenter", enterHoverMode, { passive: true });
  hoverTarget.addEventListener("pointerleave", leaveHoverMode, { passive: true });

  const visibilityObserver = new IntersectionObserver(
    entries => {
      isComponentVisible = entries.some(entry => entry.isIntersecting);
      if (shouldAnimate()) {
        startLoop();
      } else {
        stopLoop();
      }
    },
    { rootMargin: "160px 0px", threshold: 0.01 }
  );

  visibilityObserver.observe(root);

  document.addEventListener("visibilitychange", () => {
    isPageVisible = !document.hidden;
    if (shouldAnimate()) {
      startLoop();
    } else {
      stopLoop();
    }
  });

  playBtn.textContent = "Hover animation on";
  playBtn.setAttribute("aria-pressed", "true");

  playBtn.addEventListener("click", () => {
    running = !running;
    playBtn.textContent = running ? "Hover animation on" : "Hover animation off";
    playBtn.setAttribute("aria-pressed", String(running));

    if (shouldAnimate()) {
      startLoop();
    } else {
      stopLoop();
      renderFrame();
    }
  });

  speedButtons.forEach(button => {
    button.addEventListener("click", () => {
      speed = Number(button.dataset.qcgeSpeed);
      speedButtons.forEach(item => item.setAttribute("aria-pressed", "false"));
      button.setAttribute("aria-pressed", "true");
    });
  });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    running = false;
    playBtn.textContent = "Hover animation off";
    playBtn.setAttribute("aria-pressed", "false");
  }

  // Draw the complete workflow once. Animation begins only on hover.
  fit();

};
