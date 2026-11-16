# AI Assist core contracts

`ai-client.mjs` is a private Next.js-to-FastAPI adapter. `policy.mjs` implements five-role capability gates, and `support-policy.mjs` implements the order-related conversation authorization boundary. Each entry has an `.d.mts` contract to avoid `any` in TypeScript imports. Never import the AI client in browser components.
