const BUCKET_CAPACITY = 10;
const REFILL_RATE = 1;

function jsonResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  };
}

exports.handler = async function (event) {
  // This demonstration accepts only POST requests.
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, {
      error: "Only POST requests are allowed"
    });
  }

  let requestBody;

  try {
    // Convert the incoming JSON text into a JavaScript object.
    requestBody = JSON.parse(event.body || "{}");
  } catch (error) {
    return jsonResponse(400, {
      error: "Request body must be valid JSON"
    });
  }

  const clientId = requestBody.clientId;

  if (!clientId || typeof clientId !== "string") {
    return jsonResponse(400, {
      error: "clientId is required"
    });
  }

  const now = Date.now();

  /*
    This is a stateless educational implementation.

    The frontend sends the current bucket state with each request because
    this project intentionally does not use a database or Redis.

    A production rate limiter must keep this state in a trusted, shared,
    server-side store and update it atomically.
  */
  let tokens = Number(requestBody.tokens);
  let lastUpdated = Number(requestBody.lastUpdated);

  // A new client starts with a full bucket.
  if (!Number.isFinite(tokens) || !Number.isFinite(lastUpdated)) {
    tokens = BUCKET_CAPACITY;
    lastUpdated = now;
  }

  // Calculate how many seconds have passed since the previous request.
  const elapsedSeconds = Math.max(
    0,
    (now - lastUpdated) / 1000
  );

  // Refill the bucket according to the elapsed time.
  tokens = Math.min(
    BUCKET_CAPACITY,
    tokens + elapsedSeconds * REFILL_RATE
  );

  // Each request needs one token.
  const allowed = tokens >= 1;

  // Spend one token only when the request is allowed.
  if (allowed) {
    tokens -= 1;
  }

  const responseData = {
    allowed,
    tokensRemaining: Number(tokens.toFixed(2)),
    lastUpdated: now,
    timestamp: new Date().toISOString()
  };

  // Return 200 for an allowed request and 429 for a throttled request.
  return jsonResponse(allowed ? 200 : 429, responseData);
};