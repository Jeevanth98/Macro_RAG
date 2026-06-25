# Macro RAG: Multi-Agent G20 Macroeconomic Intelligence & Copilot

An enterprise-grade, full-stack macroeconomic analysis platform, risk simulation lab, and AI copilot designed for G20 nations. The application integrates automated data ingestion from official APIs, multi-layered quality validation, dynamic simulation, and generative AI (Gemini API) to deliver real-time economic insights and reporting.

---

### 🚀 Key Features

*   **Executive Dashboard**: Real-time G20 indicator tracking (GDP, CPI, Unemployment) with dynamic geospatial world heatmaps, US Treasury yield curves, and interactive alert watchlist configurations.
*   **Macro Copilot**: Advanced chat assistant powered by **Gemini 2.5 Flash** with dense (ChromaDB) and sparse (BM25) search fusion, summaries, detailed analyses, and live indicators attribution.
*   **Enterprise Confidence Engine**: Every AI-generated response includes a dynamic, backend-calculated confidence score (High/Medium/Low) based on RAG retrieval scores, citation coverage, source credibility, and LLM logical checks, supporting graceful weighting adaptation for RAG and non-RAG pipelines.
*   **AI Quality Center**: An executive evaluation dashboard displaying RAGAS and TruLens benchmark metrics, datasets parameters, and historical evaluation runs to transparently showcase system reliability.
*   **RAGAS Benchmark Evaluation**: Built-in support for measuring RAG quality using metrics like **Faithfulness**, **Answer Relevancy**, **Context Precision**, and **Context Recall**.
*   **TruLens Triad Evaluation**: Measures pipeline fidelity through **Groundedness**, **Answer Relevance**, and **Context Relevance** checks, alongside token costs and latency metrics.
*   **Risk Simulation Lab**: Adjust economic levers (GDP growth, policy interest rates, inflation) to generate probabilistic economic scenarios (stagflation, overheating, recession) with structural trade-offs.
*   **Custom Report Generator**: Auto-drafts publication-ready reviews with CSS-styled charts, data summaries, and bibliographic records.
*   **Multi-Layered Validation Engine**: Multi-weighted data checks (Source, Format, Quality, and Range) to automatically approve clean data or route anomalies to an admin review queue.
*   **Human-in-the-loop Validation**: Dedicated administrative dashboard displaying flagged anomalous data synchronization payloads with full approve/reject capability.
*   **LangSmith Observability**: Complete nesting tracing for retrieval-to-generation chains, operating with production-safe fallback when tracing is disabled.

---

## 🏗️ Updated AI Architecture Flow

The evaluation, validation, and observability services form a first-class loop inside the G20 intelligence platform:

```
    User Query
        │
        ▼
  Question Router
        │
        ├──► [LIVE_DATA / BOTH] ───────► FRED SQLite KPI Retrieval
        │
        └──► [DOCUMENT_RETRIEVAL / BOTH]
                     │
                     ▼
        Hybrid Retrieval (ChromaDB + BM25)
                     │
                     ▼
           Reciprocal Rank Fusion (RRF)
                     │
                     ▼
               Prompt Builder
                     │
                     ▼
                   Gemini
                     │
                     ▼
             Confidence Engine ◄─────── LangSmith Observability
                     │
                     ▼
                API Response
                     │
                     ▼
             AI Quality Center (RAGAS + TruLens Benchmarks)
```

---

## 🛠️ Technology Stack

*   **Frontend**: React (Vite SPA), Vanilla CSS, Lucide React, Recharts, React Simple Maps.
*   **Backend**: Node.js, Express, TypeScript, Prisma ORM, SQLite.
*   **Generative AI**: Google Generative AI SDK, LangChain.
*   **Retrieval**: Hybrid RAG, BM25, ChromaDB (embedding: `BAAI/bge-small-en-v1.5`), Reciprocal Rank Fusion (RRF).
*   **Evaluation**: RAGAS, TruLens.
*   **Observability**: LangSmith.
*   **Analytics**: Python (Pandas, NumPy).
*   **Containerization**: Docker, Docker Compose (Node backend, React frontend, Neo4j graph db).

---

## 💎 Enterprise AI Engineering Features

*   **Retrieval-Augmented Generation**: Dual-retriever strategy with RRF rank alignment.
*   **Confidence Scoring**: Real-time composite scoring and re-normalization for varying pipeline signals.
*   **AI Evaluation Dashboard**: Consolidated dashboard for RAGAS & TruLens performance transparency.
*   **Benchmark Dataset Support**: Structured QA reference datasets to run systematic evaluations.
*   **AI Quality Monitoring**: Persistent storage of historical metrics to track regressions and improvements.
*   **Source Attribution**: Document matching and live FRED economic indicators integration.
*   **Production-Oriented Architecture**: Decoupled TS services, sandbox-safe execution, and Docker-orchestrated containers.

---

## 📷 Screenshots

### AI Quality Center Dashboard
![AI Quality Center](file:///C:/Users/krish/.gemini/antigravity-ide/brain/db2ebf75-cdc5-4995-ba7b-21023f617e98/media__1782383215271.png)
*The AI Quality Center displays benchmark evaluation metrics (RAGAS and TruLens), datasets characteristics, system quality status, and historical score trends.*

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

---

## 🗺️ Future Roadmap
*   **Confidence Calibration v2**: Adaptive calibration curves based on user feedback.
*   **GraphRAG Integration**: Multi-hop retrieval using Graph databases.
*   **Neo4j Knowledge Graph**: Mapping entities and economic dependencies.
*   **Automated Benchmark Pipeline**: Triggering RAGAS evaluations on every pull request.
*   **Continuous Evaluation**: Scheduling nightly benchmark suite runs.
*   **Human Feedback Loop**: Aligning validation outputs with manual admin approvals.
*   **Retrieval Analytics**: Tracking chunk hit-rates and context usefulness.
*   **Prompt Versioning**: Logging prompt templates inside LangSmith prompt registry.
*   **Evaluation Trend Analysis**: Enhanced statistical charts for history tracking.
