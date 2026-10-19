# Token Bucket Rate Limiter

A simple cloud-systems demonstration of the Token Bucket rate-limiting algorithm.

The project includes a Netlify serverless function and an interactive browser dashboard that simulates API traffic in real time. Requests are shown as either allowed or throttled, while the dashboard displays the remaining tokens in the bucket.

## Demo

Live demo link:

(https://token-bucket-rate-limiter.netlify.app/?)

## Features

- Token Bucket rate-limiting algorithm.
- Serverless backend using a Netlify Function.
- Adjustable traffic rate from 1 to 20 requests per second.
- Start and stop simulation controls.
- Live allowed and throttled request counters.
- Visual token-bucket indicator.
- Timestamped request log.
- No paid APIs, API keys, or external database.
- Plain HTML, CSS, and JavaScript.

## How Token Bucket works

The bucket has a maximum capacity of 10 tokens.

- Tokens refill at a rate of 1 token per second.
- Each request needs one token.
- If at least one token is available, the request is allowed.
- The token is removed from the bucket.
- If fewer than one token is available, the request is throttled.
- The bucket cannot contain more than its maximum capacity.

This allows short bursts of traffic while limiting the long-term request rate.

## Project structure

```text
rate-limiter/
├── index.html
├── styles.css
├── script.js
├── netlify.toml
├── README.md
└── netlify/
    └── functions/
        └── rate-limiter.js
```

## Run locally

Install the Netlify CLI:

```bash
npm install -g netlify-cli
```

Start the local development server:

```bash
netlify dev
```

Open the local website:

```text
http://localhost:8888
```

The function endpoint is:

```text
http://localhost:8888/.netlify/functions/rate-limiter
```

## Technology

- HTML
- CSS
- JavaScript
- Node.js
- Netlify Functions
- Netlify CLI

## Limitations

This project is an educational demonstration.

Because no database or Redis instance is used, the current bucket state is sent between the browser and the serverless function. This makes the demo easy to run for free, but it is not secure production rate limiting because a client could modify its own state.

A production implementation would keep bucket state in a trusted, shared, server-side store such as Redis and update it atomically. It would also authenticate clients and protect the rate-limiter endpoint itself.

## Future improvements

- Use Redis or another shared data store.
- Add per-user or per-API-key limits.
- Compare Token Bucket with Sliding Window and Leaky Bucket algorithms.
- Add backend latency and error-rate metrics.
- Implement adaptive refill rates based on simulated backend load.
- Add automated tests.
