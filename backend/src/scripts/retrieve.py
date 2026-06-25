import os
import sys
import json
import traceback
from pathlib import Path
import dotenv
import chromadb
from chromadb.api.types import EmbeddingFunction, Documents, Embeddings
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi

# 1. Load Environment Variables
dotenv_path = dotenv.find_dotenv()
if not dotenv_path:
    # Fallback search locations
    script_dir = Path(__file__).resolve().parent
    dotenv_path = script_dir.parents[2] / ".env"

dotenv.load_dotenv(dotenv_path)

project_root = Path(dotenv_path).parent if dotenv_path else Path(__file__).resolve().parents[2]
CHROMA_PATH = os.getenv("CHROMA_PATH", "./data/chroma_db")
chroma_abs_path = os.path.abspath(project_root / CHROMA_PATH)

# Define Custom Embedding Function using sentence-transformers (same as ingest.py)
class HuggingFaceBGEEmbeddings(EmbeddingFunction):
    def __init__(self, model_name="BAAI/bge-small-en-v1.5"):
        self.model = SentenceTransformer(model_name)
    
    def __call__(self, input: Documents) -> Embeddings:
        embeddings = self.model.encode(input, normalize_embeddings=True)
        return embeddings.tolist()

def tokenize(text):
    # Simple whitespace/lowercase tokenizer
    return [word.strip(".,!?\"'()[]{}*-_") for word in text.lower().split() if word.strip()]

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No query provided", "results": []}))
        return

    query = sys.argv[1]
    
    vector_results = []
    bm25_results = []
    
    vector_success = False
    bm25_success = False
    
    client = None
    collection = None
    all_chunks = None
    
    # 2. Connect to ChromaDB
    try:
        if not os.path.exists(chroma_abs_path):
            raise FileNotFoundError(f"ChromaDB path does not exist at {chroma_abs_path}")
            
        client = chromadb.PersistentClient(path=chroma_abs_path)
        embedding_fn = HuggingFaceBGEEmbeddings()
        collection = client.get_collection(
            name="g20_documents",
            embedding_function=embedding_fn
        )
        
        # Get all chunks for BM25 and for details retrieval
        all_chunks = collection.get()
        vector_success = True
    except Exception as e:
        # Graceful degradation logging (stderr so it doesn't pollute JSON output)
        print(f"Error connecting to ChromaDB: {e}", file=sys.stderr)
        # If vector database is totally offline, we must degrade
        vector_success = False

    # 3. Vector Search
    if vector_success and collection:
        try:
            # Query vector DB for top 5 results
            results = collection.query(
                query_texts=[query],
                n_results=5
            )
            
            # Format vector results
            if results and results["documents"] and len(results["documents"]) > 0:
                for i in range(len(results["documents"][0])):
                    doc_id = results["ids"][0][i]
                    doc_text = results["documents"][0][i]
                    doc_metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                    distance = results["distances"][0][i] if "distances" in results and results["distances"] else 0.0
                    
                    vector_results.append({
                        "id": doc_id,
                        "text": doc_text,
                        "metadata": doc_metadata,
                        "score": distance
                    })
        except Exception as e:
            print(f"Vector search failed: {e}", file=sys.stderr)
            vector_success = False

    # 4. BM25 Search
    if all_chunks and all_chunks["documents"] and len(all_chunks["documents"]) > 0:
        try:
            corpus_docs = all_chunks["documents"]
            corpus_metadatas = all_chunks["metadatas"]
            corpus_ids = all_chunks["ids"]
            
            tokenized_corpus = [tokenize(doc) for doc in corpus_docs]
            bm25 = BM25Okapi(tokenized_corpus)
            
            tokenized_query = tokenize(query)
            scores = bm25.get_scores(tokenized_query)
            
            # Pair scores with indexes and sort descending
            scored_indices = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
            
            # Get top 5 BM25 matches
            for rank, (idx, score) in enumerate(scored_indices[:5]):
                if score <= 0.0:
                    continue  # Ignore documents with zero keyword matches
                    
                bm25_results.append({
                    "id": corpus_ids[idx],
                    "text": corpus_docs[idx],
                    "metadata": corpus_metadatas[idx] if corpus_metadatas else {},
                    "score": float(score)
                })
            bm25_success = True
        except Exception as e:
            print(f"BM25 search failed: {e}", file=sys.stderr)
            bm25_success = False
    else:
        print("No documents in ChromaDB collection, BM25 skipped.", file=sys.stderr)
        bm25_success = False

    # 5. Hybrid Fusion (RRF)
    # If both failed or are empty, return empty list
    if not vector_results and not bm25_results:
        print(json.dumps({
            "vector_success": vector_success,
            "bm25_success": bm25_success,
            "results": []
        }))
        return

    # Reciprocal Rank Fusion (RRF) formula:
    # RRF_Score(doc) = sum_{m in models} 1 / (k + rank_m(doc))
    # where k = 60
    k = 60
    rrf_scores = {}
    doc_registry = {}  # Store full doc objects by ID
    
    # Process vector ranks
    for rank, doc in enumerate(vector_results):
        doc_id = doc["id"]
        if doc_id not in doc_registry:
            doc_registry[doc_id] = {
                "id": doc["id"],
                "text": doc["text"],
                "metadata": doc["metadata"],
                "vector_score": doc["score"],
                "bm25_score": None
            }
        else:
            doc_registry[doc_id]["vector_score"] = doc["score"]
        rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (1.0 / (k + rank + 1))
        
    # Process BM25 ranks
    for rank, doc in enumerate(bm25_results):
        doc_id = doc["id"]
        if doc_id not in doc_registry:
            doc_registry[doc_id] = {
                "id": doc["id"],
                "text": doc["text"],
                "metadata": doc["metadata"],
                "vector_score": None,
                "bm25_score": doc["score"]
            }
        else:
            doc_registry[doc_id]["bm25_score"] = doc["score"]
        rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (1.0 / (k + rank + 1))

    # Sort final documents by RRF score descending
    sorted_docs = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
    
    # Select top 5
    final_results = []
    for doc_id, rrf_score in sorted_docs[:5]:
        doc = doc_registry[doc_id]
        final_results.append({
            "id": doc["id"],
            "text": doc["text"],
            "metadata": doc["metadata"],
            "rrf_score": rrf_score,
            "vector_score": doc["vector_score"],
            "bm25_score": doc["bm25_score"]
        })

    # Print final JSON output
    print(json.dumps({
        "vector_success": vector_success,
        "bm25_success": bm25_success,
        "results": final_results,
        "vector_results": vector_results,
        "bm25_results": bm25_results
    }))

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(json.dumps({
            "error": str(e),
            "traceback": traceback.format_exc(),
            "results": []
        }))
