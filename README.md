# ClauseGuard

> AI-powered contract risk analysis platform. Upload a contract, get instant risk scores, flagged clauses, and actionable suggestions — in seconds.


---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Risk Categories](#risk-categories)
- [Project Structure](#project-structure)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

ClauseGuard is a SaaS platform that helps legal teams, founders, and freelancers understand the risk profile of any contract before signing. Powered by **Gemini 2.5 Flash**, it identifies dangerous clauses across five categories, scores them from 0–100, and suggests concrete improvements — all via a clean REST API.

---

## Features

- **Instant Risk Scoring** — Overall 0–100 risk score with per-clause breakdown
- **5 Risk Categories** — Liability, Termination, Payment, IP, and Dispute resolution
- **Plain English Summaries** — 2–3 sentence summary of the contract's risk profile
- **Actionable Suggestions** — Specific rewording recommendations for every flagged clause
- **JWT Authentication** — Secure user auth with token-based access
- **Microservices Architecture** — Independent gateway and AI service for scalability
- **TypeScript Throughout** — Fully typed codebase across all services

---

## Architecture

`<img width="2720" height="3440" alt="clauseguard_aws_style_architecture" src="https://github.com/user-attachments/assets/fd253ef8-1f63-4b0b-a614-200483b8a873" />


## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Language | TypeScript |
| Package Manager | pnpm (monorepo) |
| Gateway | Express.js |
| AI Service | Express.js |
| AI Model | Google Gemini 2.5 Flash |
| Auth | JWT (jsonwebtoken) |
| Dev Server | ts-node-dev |
| Deployment | Docker / Railway / Render |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Google AI Studio API key ([get one here](https://aistudio.google.com/apikey))

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/clauseguard.git
cd clauseguard

# Install all dependencies
pnpm install
```

### Running Locally

```bash
# Terminal 1 — Start the Gateway
cd services/gateway
pnpm dev

# Terminal 2 — Start the AI Service
cd services/ai-service
pnpm dev
```

Gateway runs on `http://localhost:3000`
AI Service runs on `http://localhost:3003`

---

## Environment Variables

### Gateway (`services/gateway/.env`)

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
AI_SERVICE_URL=http://localhost:3003
```

### AI Service (`services/ai-service/.env`)

```env
PORT=3003
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=AIza_your_gemini_api_key_here
```

---

## API Reference

### Auth

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Contract Analysis

#### Analyze Contract
```http
POST /api/ai/analyze
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "This Agreement is entered into between Party A and Party B..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overallScore": 72,
    "summary": "This contract carries significant risk for the vendor. Termination rights are heavily one-sided and the IP assignment clause is overly broad. Payment terms lack protections against late payment.",
    "clauses": [
      {
        "text": "Client may terminate this agreement at any time without notice.",
        "category": "termination",
        "score": 90,
        "reason": "Unilateral termination with no notice period leaves the vendor with zero protection.",
        "suggestion": "Add a minimum 30-day written notice requirement for termination by either party."
      },
      {
        "text": "All work product, inventions, and ideas shall be the sole property of the Client.",
        "category": "ip",
        "score": 78,
        "reason": "Overly broad IP assignment may capture pre-existing work or work done outside the scope.",
        "suggestion": "Limit IP assignment to deliverables created specifically under this contract. Carve out pre-existing IP."
      }
    ]
  }
}
```

---

## Risk Categories

| Category | What It Covers |
|---|---|
| `liability` | Exposure to unlimited damages or one-sided indemnification |
| `termination` | Unfair or unilateral termination rights |
| `payment` | Late payment, non-payment protections, unfavorable terms |
| `ip` | Intellectual property ownership and assignment risks |
| `dispute` | Arbitration, jurisdiction, or dispute resolution that favors one party |

**Score Guide:**
- `0–30` Low risk
- `31–60` Moderate risk — review recommended
- `61–80` High risk — negotiate before signing
- `81–100` Critical risk — do not sign without legal review

---

## Project Structure

```
clauseguard/
├── services/
│   ├── gateway/                  # API gateway & auth
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   └── ai.ts
│   │   │   ├── middleware/
│   │   │   │   └── auth.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── .env
│   │
│   └── ai-service/               # AI analysis service
│       ├── src/
│       │   ├── services/
│       │   │   └── geminiService.ts
│       │   ├── routes/
│       │   │   └── analyze.ts
│       │   └── index.ts
│       ├── package.json
│       └── .env
│
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## Deployment

### Docker

```bash
# Build and run all services
docker-compose up --build
```

### Railway / Render

1. Connect your GitHub repo
2. Create two services: `gateway` and `ai-service`
3. Set root directory for each (`services/gateway`, `services/ai-service`)
4. Add environment variables in the dashboard
5. Deploy

### Environment for Production

```env
NODE_ENV=production
JWT_SECRET=<strong-random-secret-min-32-chars>
GEMINI_API_KEY=<your-production-gemini-key>
AI_SERVICE_URL=<your-ai-service-internal-url>
```

---

## Roadmap

- [ ] PDF and DOCX file upload support
- [ ] Contract comparison (v1 vs v2 diff)
- [ ] Clause-level chat ("explain this in plain English")
- [ ] Team workspaces and contract history
- [ ] Webhook support for async analysis of large contracts
- [ ] Frontend dashboard (React)
- [ ] Stripe billing integration

---

## License

MIT © 2025 Sushrut. See [LICENSE](./LICENSE) for details.

---

<p align="center">Built with ☕ and TypeScript</p>
