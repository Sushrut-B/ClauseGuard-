# ClauseGuard 🛡️

ClauseGuard is a cutting-edge, AI-powered contract lifecycle management (CLM) platform designed for enterprise legal teams. By leveraging advanced Large Language Models (LLMs) and a robust microservices architecture, ClauseGuard automates risk analysis, compliance checking, obligation tracking, and contract redlining.

---

## 🌟 Key Features

* **🧠 AI-Powered Risk Analysis**: Upload PDF contracts and instantly receive a comprehensive risk breakdown, clause-by-clause analysis, and severity scoring using Google Gemini.
* **📜 Custom Playbook Compliance**: Define custom legal playbooks (e.g., "Standard Payment Terms") and have the AI automatically evaluate incoming contracts against your company's specific compliance rules.
* **⚖️ Cross-Document RAG (Conflict Detection)**: Upload multiple contracts (e.g., an MSA and an SOW) to automatically detect contradictions, overlapping liabilities, and mismatched terms.
* **✍️ Auto-Redlining**: Generate legally sound, alternative clause suggestions with a single click to instantly mitigate identified risks.
* **📅 Smart Obligations & Reminders**: The AI automatically extracts key dates and deliverables from contracts and syncs them with our Scheduler Service to send automated reminders.
* **💳 Enterprise Billing**: Full Stripe integration with a dynamic fallback "Mock Checkout" UI for development environments. Manage subscriptions, upgrade to Pro/Enterprise tiers seamlessly.
* **🎨 Stunning UI/UX**: Built with React and modern CSS, featuring fluid animations, glowing spotlight effects, and responsive GSAP-powered layouts.

---

## 🏗️ Architecture

ClauseGuard is built on a highly scalable, fault-tolerant **Microservices Architecture**, orchestrated via an API Gateway.

```mermaid
graph TD
    User([User / Web Client])
    Gateway[API Gateway<br>Express / Proxy]
    
    subgraph Microservices Cluster
        AI[AI Service<br>Gemini Integration]
        Billing[Billing Service<br>Stripe Integration]
        Contract[Contract Service<br>Core Logic]
        Scheduler[Scheduler Service<br>Notifications]
    end
    
    subgraph External APIs
        Gemini[Google Gemini API]
        Stripe[Stripe API]
    end
    
    subgraph Data Layer
        DB[(PostgreSQL<br>Shared DB / ORM)]
    end
    
    User -->|HTTP/REST| Gateway
    Gateway -->|/api/ai| AI
    Gateway -->|/api/billing| Billing
    Gateway -->|/api/contracts| Contract
    Gateway -->|/api/reminders| Scheduler
    
    AI -->|Prompt/Completion| Gemini
    Billing -->|Checkout/Webhooks| Stripe
    
    AI --> DB
    Billing --> DB
    Contract --> DB
    Scheduler --> DB
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18, Vite
- **Styling**: CSS Modules, Vanilla CSS
- **Animations**: GSAP, Framer Motion
- **Icons**: Lucide React
- **Routing**: React Router DOM

### Backend (Microservices)
- **Runtime**: Node.js, TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (via Sequelize ORM)
- **AI Integration**: `@google/generative-ai` (Gemini)
- **Payments**: Stripe SDK
- **Security**: JWT Authentication, Helmet, Express Rate Limit

---

## 📸 Screenshots

*(Replace the paths below with your actual screenshot images as you capture them)*

### Dashboard & Analytics
![Dashboard Screenshot](client/public/images/dashboard.png)
*Centralized view of contract health, active risks, and recent uploads.*

### AI Contract Analysis
![Analysis Screenshot](client/public/images/insights.png)
*Clause-by-clause risk detection and auto-redlining interface.*

### Cross-Document Comparison
![Comparison Screenshot](client/public/images/compare.png)
*Detecting contradictions between Master Service Agreements and Statements of Work.*

### Custom Playbooks
![Playbook Screenshot](client/public/images/playbook.png)
*Defining organizational compliance rules for the AI to enforce.*

### Smart Obligations & Reminders
![Reminders Screenshot](client/public/images/reminders.png)
*Automated tracking of key deliverables extracted by the AI.*

### Enterprise Billing & Checkout
![Checkout Screenshot](client/public/images/billing.png)
*Seamless Stripe checkout flow and subscription management.*

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- PostgreSQL (Running locally or via Docker)
- Google Gemini API Key
- Stripe Account (Test Keys)

### Environment Setup
Create a `.env` file in the root of each microservice (`api-gateway`, `ai-service`, `billing-service`, `contract-service`, `scheduler-service`) and the `client`. 

*Example for `ai-service/.env`:*
```env
PORT=3004
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clauseguard
DB_USER=postgres
DB_PASSWORD=your_password
GEMINI_API_KEY=your_gemini_key
```

### Running the Application

1. **Install Dependencies**
   Navigate to each microservice folder and the client folder, and run:
   ```bash
   npm install
   ```

2. **Start the Microservices**
   In separate terminal windows, run the following command inside each backend service folder:
   ```bash
   npm run dev
   ```

3. **Start the Frontend Client**
   Navigate to the `client` folder and run:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📄 License
This project is proprietary and confidential. Unauthorized copying of this file, via any medium, is strictly prohibited.
