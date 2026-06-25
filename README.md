# Macro RAG: Multi-Agent G20 Macroeconomic Intelligence & Copilot

An enterprise-grade, full-stack macroeconomic analysis platform, risk simulation lab, and AI copilot designed for G20 nations. The application integrates automated data ingestion from official APIs, multi-layered quality validation, dynamic simulation, and generative AI (Gemini API) to deliver real-time economic insights and reporting.

---

## 🚀 Key Features

### 1. Executive Dashboard & Visualizations
*   **KPI Tracking**: Real-time economic indicators (GDP Growth, Core CPI, Unemployment, Fed Funds Rate, Consumer Sentiment, Nonfarm Payrolls) with interactive trend badges and sparklines.
*   **Dynamic World Heatmap**: A custom-drawn global visualization (using React Simple Maps) to represent GDP, Inflation, and Unemployment across the G20.
*   **Asset Yield Curves**: Interactive visualization of the United States Treasury Yield Curve (comparing current rates with 1 month ago).
*   **Watchlist Management**: Add and track targeted indicators/countries, with capabilities to configure alert thresholds.

### 2. Macro Copilot (Hybrid RAG Conversational Assistant)
*   An AI assistant powered by **Gemini 2.5 Flash** integrated with a **Hybrid Retrieval-Augmented Generation (RAG)** architecture.
*   **Hybrid Retrieval**: Combines dense vector search (ChromaDB) and sparse keyword retrieval (BM25) using **Reciprocal Rank Fusion (RRF)** to retrieve context from G20 macroeconomic reports before generating responses.
*   **Summary Mode**: Delivers quick, concise 2-3 sentence summaries backed by retrieved documents.
*   **Detailed Mode**: Yields comprehensive analytical papers with real-world source citations.
*   **Sources & Badges**: Dynamically displays a list of "Sources Used" and a "Live Economic Indicators" badge when FRED data is utilized.

### 3. PDF Ingestion & Knowledge Base
*   Curated repository of official macroeconomic PDF reports (e.g. IMF World Economic Outlook, World Bank Global Economic Prospects, OECD Economic Outlook, RBI Annual Report, Economic Survey of India).
*   **Ingestion Pipeline**: Recursively scans, extracts text, chunks (size 800, overlap 150), embeds (`BAAI/bge-small-en-v1.5`), and indexes files into ChromaDB.
*   Rebuilds vector stores manually on command.

### 4. Retrieval Pipeline Architecture
```
User Question
      │
      ▼
Question Router ──► (LIVE_DATA / BOTH) ──► SQLite/FRED KPI Retrieval
      │
      ▼ (DOCUMENT_RETRIEVAL / BOTH)
BM25 Keyword Search  +  ChromaDB Vector Search (BAAI/bge-small-en-v1.5)
      │                       │
      └───────────┬───────────┘
                  ▼
     Reciprocal Rank Fusion (RRF)
                  │
                  ▼ (Top 5 Chunks)
           Prompt Builder
                  │
                  ▼
                Gemini
                  │
                  ▼
        Response with Sources
```

### 5. LangSmith Observability
*   Traces complete macroeconomic request lifecycles including inputs, outputs, latency, errors, and metadata.
*   Presents each stage as nested child spans (`Question Router`, `Vector/BM25 Search`, `RRF Fusion`, `FRED Retrieval`, `Gemini Request`).
*   **Production-Safe**: Tracing is optional. If disabled (`LANGSMITH_ENABLED=false`) or the API key is absent, the application bypasses tracing gracefully without throwing exceptions or interrupting user requests.

### 3. Risk Simulation Lab
*   Stress-test sovereign economies by adjusting critical inputs: GDP growth, inflation, unemployment, and policy interest rates.
*   Uses built-in heuristic models to generate detailed macroeconomic assessments (Stagflation, Recession/Deflation, Goldilocks, Overheating).
*   Displays optimistic, pessimistic, and most probable scenarios, highlighting structural pros and cons.

### 4. Custom Report Generator
*   A form-driven report architect that drafts publication-ready economic reviews.
*   Dynamically calls the Gemini API to produce clean HTML reports including executive summaries, custom CSS-styled data tables, embedded bar charts, and citations.

### 5. Automated Data Sync & FRED Pipeline
*   Integrated service connecting to the **Federal Reserve Economic Data (FRED) API** to fetch observations for critical economic indicators.
*   Runs automated mapping on series IDs like `A191RL1Q225SBEA` (Real GDP), `CPILFESL` (Core CPI), `UNRATE` (Unemployment), and `DGS10` (10-Year Treasury Yields).

### 6. Multi-Layered Validation Engine
Every incoming data series is evaluated through a weighted four-layer validation mechanism before storage:
*   **Source Validation (20% weight)**: Grades the credibility of the data provider (e.g., official agencies vs external scrapers).
*   **Format Validation (30% weight)**: Ensures payload structures match strict criteria.
*   **Quality Validation (25% weight)**: Identifies missing entries, null parameters, or NaN values.
*   **Range Validation (25% weight)**: Applies boundary filters to detect anomalous spikes or outlier percentage changes.
*   *Auto-Approval*: Data scoring above 80/100 is merged directly into production; all other entries are routed to the review queue.

### 7. Human-in-the-Loop Approval Queue
*   A dedicated administrative dashboard displaying all data sync runs flagged as anomalous (validation score <= 80).
*   Shows itemized score cards, details, and warnings for format/range/quality mismatches.
*   Gives administrators full control to either **Approve** (merge to SQLite production) or **Reject** (discard from queue).

### 8. Python Analytics & Insights Engine (`economic_graphrag`)
*   Located in `economic_graphrag/analytics/insights.py`, this module provides:
    *   **Outlier Detection**: Identifies countries with values >2σ from the G20 mean.
    *   **Trend Reversals**: Flags critical direction changes in 3-year rolling average slopes.
    *   **Record Proximities**: Tracks metrics near historic highs/lows since 2000.
    *   **Economic Strength Scoring**: Computes a composite 0-100 rating based on growth, inflation, and labor conditions.
    *   **Regime Classification**: Classifies economies into cyclical phases (Expansion, Late Cycle, Stagflation, Recession, Slowdown, Recovery).

---

## 🛠️ Technology Stack

*   **Frontend**: React (Vite SPA), Vanilla CSS, Lucide React, Recharts (Charts), React Simple Maps / D3 (Geospatial maps).
*   **Backend**: Node.js, Express, TypeScript, Prisma ORM, SQLite.
*   **Generative AI**: Google Generative AI SDK (Gemini models), LangChain, LangSmith, ChromaDB, BM25, Reciprocal Rank Fusion (RRF).
*   **Analytics**: Python (Pandas, NumPy).
*   **Containerization**: Docker, Docker Compose (orchestrating Python/Streamlit & Neo4j database containers).

---

## 📦 Project Architecture

```
Frontend (React) ◄──► Express Backend ◄──► Question Router
                             │
                             ├─► BM25 + ChromaDB (retrieve.py) ─► RRF ─► Prompt Builder ─► Gemini
                             │
                             └─► LangSmith (observability spans)
```

```
Macro_RAG/
├── backend/                       # Express Node.js & TypeScript Backend
│   ├── prisma/                    # Schema definition and SQLite Seeder
│   └── src/
│       ├── routes/                # API and Approvals endpoints
│       └── services/              # FRED sync, Validator, and Gemini adapters
├── frontend/                      # React (Vite) Single Page Application
│   ├── src/
│   │   ├── components/            # Reusable charts, maps, and widgets
│   │   ├── pages/                 # UI pages (Dashboard, Simulation, Copilot, Approvals, etc.)
│   │   └── services/              # Axios/Fetch API wrapper
├── economic_graphrag/             # Python Analytics & Graph RAG Ingestion Pipeline
│   └── analytics/                 # Smart Insights and Scoring engine
├── data/                          # SQLite and Chroma DB vector stores
├── docker-compose.yml             # Local service orchestration
└── requirements.txt               # Python package requirements
```

---

## ⚙️ Getting Started & Local Setup

### Prerequisites
*   Node.js (v18+)
*   npm or yarn
*   A Gemini API Key (for Copilot and Report generation)
*   A FRED API Key (for real-time data syncs)

### Backend Configuration
1.  Navigate to the `/backend` folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment variables. Copy the template from root `env` file or create a `.env` in the `/backend` directory:
    ```env
    DATABASE_URL="file:./dev.db"
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
    FRED_API_KEY="YOUR_FRED_API_KEY"
    ```
4.  Push the Prisma database schema and run the seed script:
    ```bash
    npx prisma db push
    npm run seed
    ```
5.  Start the development server:
    ```bash
    npm run dev
    ```
    The backend will run at `http://localhost:8000`.

### Knowledge Base & Ingestion Setup
To populate the vector database with macroeconomic PDF reports:
1. Ensure you have installed the Python requirements in the project root:
   ```bash
   pip install -r requirements.txt
   ```
2. Place your macroeconomic PDF documents in `knowledge_base/Global` or `knowledge_base/India`.
3. Rebuild and ingest the documents into ChromaDB by running the ingestion command in the `backend` directory:
   ```bash
   npm run ingest
   ```

### Frontend Configuration
1.  Navigate to the `/frontend` folder:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    Open your browser and navigate to `http://localhost:5173`.
