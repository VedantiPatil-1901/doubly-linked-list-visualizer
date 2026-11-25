const API_BASE = "/api/dll";
const AVAIL_POOL_SIZE = 60;
const SLOW_PACE_MULTIPLIER = 1.8;

const INSERT_ALGO = {
  title: "Algorithm 5.16: INSTWL (Insert)",
  tag: "INSTWL",
  subtitle: "Inserts an item into the doubly linked list using a free node from AVAIL.",
  steps: [
    "1. [OVERFLOW?] If AVAIL = NULL, write OVERFLOW and exit.",
    "2. [Remove from AVAIL & copy data] NEW := AVAIL; AVAIL := FORW[AVAIL]; INFO[NEW] := ITEM.",
    "3. [Link into list] Set FORW/BACK pointers (FORW[LOCA] := NEW, FORW[NEW] := LOCB, BACK[LOCB] := NEW, BACK[NEW] := LOCA) and update HEAD / TAIL.",
    "4. Exit."
  ]
};

const DELETE_ALGO = {
  title: "Algorithm 5.15: DELTWL (Delete)",
  tag: "DELTWL",
  subtitle: "Unlinks target node LOC from the list and returns it to the AVAIL pool.",
  steps: [
    "1. [Locate & delete node] Find LOC; set FORW[BACK[LOC]] := FORW[LOC] and BACK[FORW[LOC]] := BACK[LOC]; update HEAD / TAIL.",
    "2. [Return node to AVAIL] Set FORW[LOC] := AVAIL and AVAIL := LOC.",
    "3. Exit."
  ]
};

const TRAVERSE_FORW_ALGO = {
  title: "Traverse Forward (FORW)",
  tag: "FORW",
  subtitle: "Starts at HEAD, applies PROCESS to each node, and advances CURR := FORW[CURR].",
  steps: [
    "1. Set CURR := HEAD.",
    "2. Repeat while CURR != NULL:",
    "3.   Apply PROCESS to INFO[CURR] (record value).",
    "4.   Set CURR := FORW[CURR].",
    "5. Exit traversal."
  ]
};

const TRAVERSE_BACK_ALGO = {
  title: "Traverse Backward (BACK)",
  tag: "BACK",
  subtitle: "Starts at TAIL, applies PROCESS to each node, and moves CURR := BACK[CURR].",
  steps: [
    "1. Set CURR := TAIL.",
    "2. Repeat while CURR != NULL:",
    "3.   Apply PROCESS to INFO[CURR] (record value).",
    "4.   Set CURR := BACK[CURR].",
    "5. Exit traversal."
  ]
};

const DEFAULT_ALGO = {
  title: "Algorithm (INSTWL / DELTWL)",
  tag: "IDLE",
  subtitle: "Click an operation to load its steps and highlight the active line during execution.",
  steps: [
    "1. [OVERFLOW check / Locate position] Verify AVAIL availability or target node LOC.",
    "2. Pop node from AVAIL: NEW := AVAIL; AVAIL := FORW[AVAIL]; INFO[NEW] := ITEM.",
    "3. Link FORW / BACK arrows into Main DLL and update HEAD / TAIL / CURR.",
    "4. On delete: unlink LOC, then return to AVAIL via FORW[LOC] := AVAIL; AVAIL := LOC."
  ]
};

const state = {
  currentNodes: [],
  steps: [],
  stepIndex: -1,
  activeMode: "IDLE",
  isPlaying: false,
  playTimer: null,
  availPool: [],
  availHeadIndex: 0,
  lastPoppedNodeId: null,
  lastFreedNodeId: null,
  processedValues: []
};

const els = {
  listSize: document.getElementById("list-size"),
  headId: document.getElementById("head-id"),
  tailId: document.getElementById("tail-id"),
  availHeadId: document.getElementById("avail-head-id"),
  availPointerLabel: document.getElementById("avail-pointer-label"),

  nodeDataInput: document.getElementById("node-data-input"),
  nodePositionInput: document.getElementById("node-position-input"),
  deleteDataInput: document.getElementById("delete-data-input"),

  btnInsertHead: document.getElementById("btn-insert-head"),
  btnInsertTail: document.getElementById("btn-insert-tail"),
  btnInsertPos: document.getElementById("btn-insert-pos"),
  btnDelete: document.getElementById("btn-delete"),
  btnClear: document.getElementById("btn-clear"),
  btnTraverseForward: document.getElementById("btn-traverse-forward"),
  btnTraverseBackward: document.getElementById("btn-traverse-backward"),

  btnPrevStep: document.getElementById("btn-prev-step"),
  btnPlayPause: document.getElementById("btn-play-pause"),
  btnNextStep: document.getElementById("btn-next-step"),
  speedSelect: document.getElementById("speed-select"),
  stepCounter: document.getElementById("step-counter"),

  stepBadge: document.getElementById("step-badge"),
  stepDescription: document.getElementById("step-description"),

  dllCanvas: document.getElementById("dll-canvas"),
  availCanvas: document.getElementById("avail-canvas"),
  transitLayer: document.getElementById("transit-layer"),

  algoTitle: document.getElementById("algo-title"),
  algoTag: document.getElementById("algo-tag"),
  algoSubtitle: document.getElementById("algo-subtitle"),
  algoStepsList: document.getElementById("algo-steps-list"),

  traversalOutput: document.getElementById("traversal-output")
};

function initAvailPool(count = AVAIL_POOL_SIZE) {
  state.availPool = Array.from({ length: count }, (_, idx) => ({
    id: `A${idx + 1}`,
    info: null,
    popped: false
  }));
  state.availHeadIndex = 0;
  state.lastPoppedNodeId = null;
  state.lastFreedNodeId = null;
}

function getActiveAvailNode() {
  for (let i = state.availHeadIndex; i < state.availPool.length; i++) {
    if (!state.availPool[i].popped) {
      return state.availPool[i];
    }
  }
  return null;
}

function isAvailEmpty() {
  return getActiveAvailNode() === null;
}

function setAlgorithmBox(mode, activeLineNumber = null) {
  const spec =
    mode === "INSERT" ? INSERT_ALGO :
    mode === "DELETE" ? DELETE_ALGO :
    mode === "TRAVERSE_FORW" ? TRAVERSE_FORW_ALGO :
    mode === "TRAVERSE_BACK" ? TRAVERSE_BACK_ALGO :
    DEFAULT_ALGO;

  els.algoTitle.textContent = spec.title;
  els.algoTag.textContent = spec.tag;
  els.algoSubtitle.textContent = spec.subtitle;

  els.algoStepsList.innerHTML = spec.steps
    .map((text, idx) => {
      const lineNum = idx + 1;
      const activeClass = activeLineNumber === lineNum ? "is-active-step" : "";
      return `
        <li class="algo-step ${activeClass}" data-line="${lineNum}">
          <span class="algo-step-num">${lineNum}</span>
          <span class="algo-step-text">${escapeHtml(text)}</span>
        </li>
      `;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function stopPlayback() {
  state.isPlaying = false;
  if (state.playTimer) {
    clearTimeout(state.playTimer);
    state.playTimer = null;
  }
  els.btnPlayPause.textContent = "Play";
}

function startPlayback() {
  if (!state.steps.length) return;
  if (state.stepIndex >= state.steps.length - 1) {
    state.stepIndex = -1;
  }
  state.isPlaying = true;
  els.btnPlayPause.textContent = "Pause";
  scheduleNextStep();
}

function scheduleNextStep() {
  if (!state.isPlaying) return;
  const baseDelay = Number(els.speedSelect.value) || 2200;
  const delay = Math.round(baseDelay * SLOW_PACE_MULTIPLIER);
  state.playTimer = setTimeout(() => {
    if (!state.isPlaying) return;
    if (state.stepIndex < state.steps.length - 1) {
      goToStep(state.stepIndex + 1);
      scheduleNextStep();
    } else {
      stopPlayback();
    }
  }, delay);
}

function updatePlaybackButtons() {
  const hasSteps = state.steps.length > 0;
  els.btnPrevStep.disabled = !hasSteps || state.stepIndex <= 0;
  els.btnNextStep.disabled = !hasSteps || state.stepIndex >= state.steps.length - 1;
  els.btnPlayPause.disabled = !hasSteps;
  els.stepCounter.textContent = `Step ${Math.max(0, state.stepIndex + 1)} / ${state.steps.length}`;
}

function animateNodeFlight(fromEl, toEl, labelText, valueText, durationMs = 1350) {
  if (!fromEl || !toEl || !els.transitLayer) return;
  const fromRect = fromEl.getBoundingClientRect();
  const toRect = toEl.getBoundingClientRect();
  if (!fromRect.width || !toRect.width) return;

  const ghost = document.createElement("div");
  ghost.className = "node-unit floating-node is-linking";
  ghost.style.left = `${fromRect.left}px`;
  ghost.style.top = `${fromRect.top}px`;
  ghost.style.transitionDuration = `${durationMs}ms`;
  ghost.innerHTML = `
    <div class="pointer-badges">
      <span class="badge badge-avail">${escapeHtml(labelText)}</span>
    </div>
    <div class="node-box">
      <div class="node-cell node-prev">
        <span class="cell-label">PREV</span>
        <span class="cell-value">?</span>
      </div>
      <div class="node-cell node-data">
        <span class="cell-label">INFO</span>
        <span class="cell-value">${escapeHtml(valueText ?? "—")}</span>
      </div>
      <div class="node-cell node-next">
        <span class="cell-label">NEXT</span>
        <span class="cell-value">?</span>
      </div>
    </div>
  `;

  els.transitLayer.appendChild(ghost);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      ghost.style.left = `${toRect.left}px`;
      ghost.style.top = `${toRect.top}px`;
    });
  });

  setTimeout(() => {
    ghost.remove();
  }, durationMs + 80);
}

function renderAvailPool() {
  const activeAvail = getActiveAvailNode();
  const availLabel = activeAvail ? activeAvail.id : "NULL";
  els.availHeadId.textContent = availLabel;
  els.availPointerLabel.textContent = availLabel;

  const htmlParts = [];
  state.availPool.forEach((node, idx) => {
    const nextFree = state.availPool.slice(idx + 1).find((n) => !n.popped);
    const forwLabel = nextFree ? nextFree.id : "NULL";
    const isCurrentAvail = activeAvail && activeAvail.id === node.id;
    const isJustPopped = state.lastPoppedNodeId === node.id && node.popped;
    const isJustReturned = state.lastFreedNodeId === node.id && !node.popped;

    htmlParts.push(`
      <div class="avail-node-unit ${isCurrentAvail ? "is-avail-head" : ""} ${node.popped ? "is-popped" : ""} ${isJustPopped || isJustReturned ? "is-highlighted" : ""}" data-avail-id="${node.id}">
        <div class="pointer-badges">
          ${isCurrentAvail ? `<span class="pointer-tag badge-avail">AVAIL</span>` : ""}
          ${isJustPopped ? `<span class="badge badge-curr">NEW</span>` : ""}
          ${isJustReturned ? `<span class="badge badge-head">LOC</span>` : ""}
        </div>
        <div class="avail-node-box">
          <div class="avail-cell avail-info">
            <span class="cell-label">INFO (${node.id})</span>
            <span class="cell-value">${node.info !== null && node.info !== undefined ? escapeHtml(node.info) : "—"}</span>
          </div>
          <div class="avail-cell avail-forw">
            <span class="cell-label">FORW</span>
            <span class="cell-value">${escapeHtml(forwLabel)}</span>
          </div>
        </div>
      </div>
    `);

    if (idx < state.availPool.length - 1) {
      htmlParts.push(`<span class="avail-arrow" aria-hidden="true">→</span>`);
    }
  });

  els.availCanvas.innerHTML = htmlParts.join("");

  if (activeAvail) {
    const activeEl = els.availCanvas.querySelector(`[data-avail-id="${activeAvail.id}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }
}

function deduplicateNodes(nodes) {
  const seen = new Set();
  return (nodes || []).filter((node) => {
    if (seen.has(node.id)) return false;
    seen.add(node.id);
    return true;
  });
}

function renderMainDll(step) {
  const nodes = deduplicateNodes(step?.nodes ?? state.currentNodes ?? []);
  const headId = step?.headId ?? null;
  const tailId = step?.tailId ?? null;
  const currentId = step?.currentId ?? null;
  const highlightedId = step?.highlightedNodeId ?? null;
  const isLinkStep = ["LINK_NEXT", "LINK_PREV", "PREPARE_LINKS", "INSERT_COMPLETE", "DELETE_COMPLETE"].includes(step?.actionType);

  const visibleListNodes = nodes.filter(
    (n) =>
      n.id !== highlightedId ||
      ["SET_HEAD_TAIL", "MOVE_HEAD", "MOVE_TAIL", "INSERT_COMPLETE", "EXIT", "PROCESS_NODE", "TRAVERSE_CHECK", "TRAVERSE_ADVANCE"].includes(step?.actionType)
  );

  els.listSize.textContent = visibleListNodes.length;
  els.headId.textContent = headId !== null && headId !== undefined ? `#${headId}` : "NULL";
  els.tailId.textContent = tailId !== null && tailId !== undefined ? `#${tailId}` : "NULL";

  const parts = [];

  parts.push(`
    <div class="null-pointer-group" id="head-null-group">
      ${headId === null || headId === undefined ? `<span class="pointer-tag badge-head">HEAD</span>` : ""}
      <div class="null-terminal" id="head-null">NULL</div>
    </div>
  `);

  nodes.forEach((node, index) => {
    const badges = [];
    if (headId === node.id) badges.push(`<span class="badge badge-head">HEAD</span>`);
    if (tailId === node.id) badges.push(`<span class="badge badge-tail">TAIL</span>`);
    if (currentId === node.id) badges.push(`<span class="badge badge-curr">CURR</span>`);

    const isHighlighted = highlightedId === node.id || currentId === node.id;
    const prevText = node.prevId !== null && node.prevId !== undefined ? `#${node.prevId}` : "NULL";
    const nextText = node.nextId !== null && node.nextId !== undefined ? `#${node.nextId}` : "NULL";

    parts.push(`
      <div class="node-unit ${isHighlighted ? "is-highlighted" : ""} ${isHighlighted && isLinkStep ? "is-linking" : ""}" data-node-id="${node.id}">
        <div class="pointer-badges">${badges.join("")}</div>
        <div class="node-box">
          <div class="node-cell node-prev">
            <span class="cell-label">PREV / BACK</span>
            <span class="cell-value">${escapeHtml(prevText)}</span>
          </div>
          <div class="node-cell node-data">
            <span class="cell-label">INFO (#${node.id})</span>
            <span class="cell-value">${escapeHtml(node.value)}</span>
          </div>
          <div class="node-cell node-next">
            <span class="cell-label">NEXT / FORW</span>
            <span class="cell-value">${escapeHtml(nextText)}</span>
          </div>
        </div>
      </div>
    `);

    if (index < nodes.length - 1) {
      parts.push(`<div class="connector-slot ${isLinkStep ? "is-active-link" : ""}" aria-hidden="true">⇄</div>`);
    }
  });

  parts.push(`
    <div class="null-pointer-group" id="tail-null-group">
      ${tailId === null || tailId === undefined ? `<span class="pointer-tag badge-tail">TAIL</span>` : ""}
      <div class="null-terminal" id="tail-null">NULL</div>
    </div>
  `);

  els.dllCanvas.innerHTML = parts.join("");
}

function applyAvailSideEffectsForStep(step) {
  if (!step) return;

  if (step.actionType === "CREATE_NODE") {
    const active = getActiveAvailNode();
    if (active) {
      const match = step.description?.match(/INFO\[NEW\]\s*:=\s*(-?\d+)/);
      active.info = match ? Number(match[1]) : els.nodeDataInput.value || "ITEM";
      active.popped = true;
      state.lastPoppedNodeId = active.id;
      state.lastFreedNodeId = null;

      const nextIdx = state.availPool.findIndex((n, i) => i > state.availHeadIndex && !n.popped);
      state.availHeadIndex = nextIdx === -1 ? state.availPool.length : nextIdx;
    }
  } else if (step.actionType === "RETURN_AVAIL") {
    const freed = [...state.availPool].reverse().find((n) => n.popped);
    if (freed) {
      const fromEl =
        els.dllCanvas.querySelector(`[data-node-id="${step.highlightedNodeId}"]`) ||
        els.dllCanvas;

      freed.info = null;
      freed.popped = false;
      state.lastFreedNodeId = freed.id;
      state.lastPoppedNodeId = null;

      const firstFreeIdx = state.availPool.findIndex((n) => !n.popped);
      state.availHeadIndex = firstFreeIdx === -1 ? state.availPool.length : firstFreeIdx;

      renderAvailPool();

      const toEl =
        els.availCanvas.querySelector(`[data-avail-id="${freed.id}"]`) ||
        els.availCanvas;
      animateNodeFlight(fromEl, toEl, "LOC → AVAIL", "NULL", 1350);
      return;
    }
  } else if (step.actionType === "CLEAR_LIST") {
    initAvailPool(AVAIL_POOL_SIZE);
  }

  renderAvailPool();

  if (step.actionType === "CREATE_NODE" && state.lastPoppedNodeId) {
    const poppedNode = state.availPool.find((n) => n.id === state.lastPoppedNodeId);
    const fromEl = els.availCanvas.querySelector(`[data-avail-id="${state.lastPoppedNodeId}"]`);
    const toEl =
      els.dllCanvas.querySelector(`[data-node-id="${step.highlightedNodeId}"]`) ||
      els.dllCanvas;
    animateNodeFlight(fromEl, toEl, "NEW → DLL", poppedNode?.info ?? "ITEM", 1350);
  }
}

function updateTraversalOutputForStep(step) {
  if (!step) return;
  const dirLabel = state.activeMode === "TRAVERSE_BACK" ? "Backward (BACK)" : "Forward (FORW)";

  if (step.actionType === "TRAVERSE_INIT") {
    state.processedValues = [];
    els.traversalOutput.textContent = `${dirLabel}: [ ]`;
  } else if (step.actionType === "PROCESS_NODE") {
    const match = step.description?.match(/INFO\[CURR\]\s*=\s*(-?\d+)/);
    if (match) {
      state.processedValues.push(Number(match[1]));
      els.traversalOutput.textContent = `${dirLabel}: [ ${state.processedValues.join("  →  ")} ]`;
    }
  }
}

function goToStep(index) {
  if (!state.steps.length || index < 0 || index >= state.steps.length) return;
  state.stepIndex = index;
  const step = state.steps[index];

  els.stepBadge.textContent = step.actionType || `STEP ${step.stepNumber}`;
  els.stepDescription.textContent = step.description || "";
  setAlgorithmBox(state.activeMode, step.algorithmLine ?? null);

  renderMainDll(step);
  applyAvailSideEffectsForStep(step);
  updateTraversalOutputForStep(step);
  updatePlaybackButtons();
}

function triggerOverflowState(message = "AVAIL = NULL: No free nodes left in AVAIL pool. OVERFLOW!") {
  stopPlayback();
  state.activeMode = "INSERT";
  state.steps = [];
  state.stepIndex = -1;
  setAlgorithmBox("INSERT", 1);
  els.stepBadge.textContent = "OVERFLOW";
  els.stepDescription.textContent = message;
  updatePlaybackButtons();
}

async function runStepOperation(mode, url, method = "POST") {
  if (mode === "INSERT" && isAvailEmpty()) {
    triggerOverflowState();
    return;
  }

  stopPlayback();
  state.activeMode = mode;
  setAlgorithmBox(mode, 1);

  try {
    const res = await fetch(url, { method });
    const data = await res.json();

    if (!res.ok || data.success === false) {
      els.stepBadge.textContent = "ERROR";
      els.stepDescription.textContent = data.message || `Request failed (${res.status})`;
      state.steps = [];
      state.stepIndex = -1;
      updatePlaybackButtons();
      return;
    }

    state.currentNodes = deduplicateNodes(data.nodes || []);
    state.steps = data.steps || [];
    state.stepIndex = -1;

    if (state.steps.length > 0) {
      goToStep(0);
      startPlayback();
    } else {
      renderMainDll({ nodes: state.currentNodes });
      els.stepBadge.textContent = "DONE";
      els.stepDescription.textContent = data.message || "Operation completed.";
      updatePlaybackButtons();
    }
  } catch (_) {
    els.stepBadge.textContent = "OFFLINE";
    els.stepDescription.textContent = `Could not reach backend at ${API_BASE}. Make sure Spring Boot is running.`;
  }
}

async function runStepTraversal(direction) {
  const isBackward = direction === "backward";
  const mode = isBackward ? "TRAVERSE_BACK" : "TRAVERSE_FORW";
  const endpoint = isBackward ? `${API_BASE}/traverse-backward-steps` : `${API_BASE}/traverse-forward-steps`;
  await runStepOperation(mode, endpoint, "GET");
}

async function syncInitialState() {
  initAvailPool(AVAIL_POOL_SIZE);
  setAlgorithmBox("IDLE", null);
  renderAvailPool();
  updatePlaybackButtons();

  try {
    const res = await fetch(`${API_BASE}/state`);
    if (res.ok) {
      const nodes = await res.json();
      state.currentNodes = deduplicateNodes(Array.isArray(nodes) ? nodes : []);
      const headId = state.currentNodes.length ? state.currentNodes[0].id : null;
      const tailId = state.currentNodes.length ? state.currentNodes[state.currentNodes.length - 1].id : null;
      renderMainDll({ nodes: state.currentNodes, headId, tailId });
      return;
    }
  } catch (_) {
    // Backend not started yet
  }
  renderMainDll({ nodes: [], headId: null, tailId: null });
}

els.btnInsertHead.addEventListener("click", () => {
  const val = Number(els.nodeDataInput.value);
  if (Number.isNaN(val) || els.nodeDataInput.value.trim() === "") {
    els.stepBadge.textContent = "INPUT";
    els.stepDescription.textContent = "Please enter a valid integer value first.";
    return;
  }
  runStepOperation("INSERT", `${API_BASE}/insert-head?data=${encodeURIComponent(val)}`, "POST");
});

els.btnInsertTail.addEventListener("click", () => {
  const val = Number(els.nodeDataInput.value);
  if (Number.isNaN(val) || els.nodeDataInput.value.trim() === "") {
    els.stepBadge.textContent = "INPUT";
    els.stepDescription.textContent = "Please enter a valid integer value first.";
    return;
  }
  runStepOperation("INSERT", `${API_BASE}/insert-tail?data=${encodeURIComponent(val)}`, "POST");
});

els.btnInsertPos.addEventListener("click", () => {
  const val = Number(els.nodeDataInput.value);
  const pos = Number(els.nodePositionInput.value);
  if (Number.isNaN(val) || els.nodeDataInput.value.trim() === "" || Number.isNaN(pos) || pos < 1) {
    els.stepBadge.textContent = "INPUT";
    els.stepDescription.textContent = "Please enter both a valid value and a 1-based position.";
    return;
  }
  runStepOperation(
    "INSERT",
    `${API_BASE}/insert-position?data=${encodeURIComponent(val)}&position=${encodeURIComponent(pos)}`,
    "POST"
  );
});

els.btnDelete.addEventListener("click", () => {
  const val = Number(els.deleteDataInput.value);
  if (Number.isNaN(val) || els.deleteDataInput.value.trim() === "") {
    els.stepBadge.textContent = "INPUT";
    els.stepDescription.textContent = "Please enter a value to delete.";
    return;
  }
  runStepOperation("DELETE", `${API_BASE}/delete?data=${encodeURIComponent(val)}`, "DELETE");
});

els.btnClear.addEventListener("click", () => {
  state.processedValues = [];
  els.traversalOutput.textContent = "[ ]";
  runStepOperation("CLEAR", `${API_BASE}/clear`, "DELETE");
});

els.btnTraverseForward.addEventListener("click", () => runStepTraversal("forward"));
els.btnTraverseBackward.addEventListener("click", () => runStepTraversal("backward"));

els.btnPrevStep.addEventListener("click", () => {
  stopPlayback();
  if (state.stepIndex > 0) {
    goToStep(state.stepIndex - 1);
  }
});

els.btnNextStep.addEventListener("click", () => {
  stopPlayback();
  if (state.stepIndex < state.steps.length - 1) {
    goToStep(state.stepIndex + 1);
  }
});

els.btnPlayPause.addEventListener("click", () => {
  if (state.isPlaying) {
    stopPlayback();
  } else {
    startPlayback();
  }
});

syncInitialState();