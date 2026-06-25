# Knowledge Base Ingestion System

This directory is the source of truth for the local PDF documents used in the **Macro RAG** platform.

## Directory Structure

* `Global/`: Put global macroeconomic reports, papers, and data sheets here.
* `India/`: Put India-specific macroeconomic reports, budget sheets, and policy documents here.

## File Organization & Ingestion

The ingestion system automatically scans these folders recursively. You do not need to register new filenames manually.

1. Simply place your PDF files in the appropriate category folder (`Global/` or `India/`).
2. Run the ingestion build script to rebuild the local vector database.

## Running Ingestion

To clear the existing database, parse all PDFs, generate embeddings (`BAAI/bge-small-en-v1.5`), and index them in ChromaDB, navigate to the `backend` folder and run:

```bash
npm run ingest
```

### Ingestion Metadata
Each chunk in the database includes the following metadata properties:
* `source`: Relative path of the document (e.g. `knowledge_base/India/budget_2026.pdf`).
* `filename`: The name of the file (e.g. `budget_2026.pdf`).
* `category`: The category folder name (`Global` or `India`).
* `page`: The 1-indexed page number where the text chunk was extracted.
* `chunk_index`: The sequential index of the chunk within the document.
