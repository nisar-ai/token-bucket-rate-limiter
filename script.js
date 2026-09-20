const BUCKET_CAPACITY = 10;
const CLIENT_ID = "dashboard-client";

const rateSlider = document.querySelector("#rateSlider");
const rateValue = document.querySelector("#rateValue");

const startButton = document.querySelector("#startButton");
const stopButton = document.querySelector("#stopButton");

const simulationStatus =
  document.querySelector("#simulationStatus");

const allowedCountElement =
  document.querySelector("#allowedCount");

const throttledCountElement =
  document.querySelector("#throttledCount");

const tokensRemainingElement =
  document.querySelector("#tokensRemaining");

const bucketFill = document.querySelector("#bucketFill");
const bucketPercentage =
  document.querySelector("#bucketPercentage");

const requestLog = document.querySelector("#requestLog");
const clearLogButton =
  document.querySelector("#clearLogButton");

let simulationRunning = false;
let simulationTimer = null;

let allowedCount = 0;
let throttledCount = 0;

/*
  The frontend stores the bucket state for this demonstration.

  This allows the project to work without Redis or a database.
  A production rate limiter must store this state in a trusted,
  shared server-side data store.
*/
let tokens = BUCKET_CAPACITY;
let lastUpdated = Date.now();

rateSlider.addEventListener("input", function () {
  rateValue.textContent = rateSlider.value;

  if (simulationRunning) {
    simulationStatus.textContent =
      `Simulation running at ${rateSlider.value} requests/second.`;
  }
});

startButton.addEventListener(
  "click",
  startSimulation
);

stopButton.addEventListener(
  "click",
  stopSimulation
);

clearLogButton.addEventListener(
  "click",
  clearLog
);

async function startSimulation() {
  // Prevent two simulation loops from running at the same time.
  if (simulationRunning) {
    return;
  }

  simulationRunning = true;

  startButton.disabled = true;
  stopButton.disabled = false;

  simulationStatus.textContent =
    `Simulation running at ${rateSlider.value} requests/second.`;

  // Send the first request immediately.
  runNextSimulationRequest();
}

function stopSimulation() {
  simulationRunning = false;

  if (simulationTimer !== null) {
    clearTimeout(simulationTimer);
    simulationTimer = null;
  }

  startButton.disabled = false;
  stopButton.disabled = true;

  simulationStatus.textContent =
    "Simulation is stopped.";
}

async function runNextSimulationRequest() {
  if (!simulationRunning) {
    return;
  }

  await sendRateLimitRequest();

  if (!simulationRunning) {
    return;
  }

  const requestsPerSecond = Number(rateSlider.value);
  const delayMilliseconds = 1000 / requestsPerSecond;

  simulationTimer = setTimeout(
    runNextSimulationRequest,
    delayMilliseconds
  );
}

async function sendRateLimitRequest() {
  try {
    const response = await fetch(
      "/.netlify/functions/rate-limiter",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          clientId: CLIENT_ID,
          tokens,
          lastUpdated
        })
      }
    );

    const data = await response.json();

    /*
      Save the updated bucket state returned by the function.
      The next simulated request will send this new state.
    */
    tokens = Number(data.tokensRemaining);
    lastUpdated = Number(data.lastUpdated);

    updateDashboard(data);
  } catch (error) {
    addLogEntry(
      "ERROR",
      "Could not reach the rate-limiter function."
    );

    console.error(error);
  }
}

function updateDashboard(data) {
  const currentTokens = Number(data.tokensRemaining);

  tokensRemainingElement.textContent =
    currentTokens.toFixed(2);

  const percentage = Math.max(
    0,
    Math.min(
      100,
      (currentTokens / BUCKET_CAPACITY) * 100
    )
  );

  bucketFill.style.height = `${percentage}%`;

  bucketPercentage.textContent =
    `${Math.round(percentage)}%`;

  if (data.allowed) {
    allowedCount += 1;
    allowedCountElement.textContent = allowedCount;

    addLogEntry(
      "ALLOWED",
      data.timestamp
    );
  } else {
    throttledCount += 1;
    throttledCountElement.textContent = throttledCount;

    addLogEntry(
      "THROTTLED",
      data.timestamp
    );
  }
}

function addLogEntry(type, timestamp) {
  const emptyMessage =
    requestLog.querySelector(".muted");

  if (emptyMessage) {
    emptyMessage.remove();
  }

  const entry = document.createElement("p");

  entry.className = "log-entry";

  if (type === "ALLOWED") {
    entry.classList.add("allowed");

    entry.textContent =
      `✅ Allowed — ${formatTimestamp(timestamp)}`;
  } else if (type === "THROTTLED") {
    entry.classList.add("throttled");

    entry.textContent =
      `🚫 Throttled — ${formatTimestamp(timestamp)}`;
  } else {
    entry.classList.add("throttled");

    entry.textContent = `⚠️ ${timestamp}`;
  }

  // Newest request appears at the top.
  requestLog.prepend(entry);

  // Keep the log from growing forever.
  while (requestLog.children.length > 100) {
    requestLog.removeChild(
      requestLog.lastElementChild
    );
  }
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 3
  });
}

function clearLog() {
  requestLog.innerHTML =
    '<p class="muted">No simulated requests yet.</p>';
}