import os
import sys
import shutil
import time
from pathlib import Path
import dotenv
import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter
import chromadb
from chromadb.api.types import EmbeddingFunction, Documents, Embeddings
from sentence_transformers import SentenceTransformer

# 1. Load Environment Variables
dotenv_path = dotenv.find_dotenv()
if not dotenv_path:
    # Fallback to default search locations relative to this script
    script_dir = Path(__file__).resolve().parent
    dotenv_path = script_dir.parents[2] / ".env"

dotenv.load_dotenv(dotenv_path)

# Determine the project root directory
project_root = Path(dotenv_path).parent if dotenv_path else Path(__file__).resolve().parents[2]
KB_DIR = project_root / "knowledge_base"

CHROMA_PATH = os.getenv("CHROMA_PATH", "./data/chroma_db")
# Convert to absolute path to avoid relative path confusion, resolving relative to project root
chroma_abs_path = os.path.abspath(project_root / CHROMA_PATH)

print(f"Loading environment from: {dotenv_path}")
print(f"ChromaDB path configured as: {chroma_abs_path}")

# Define Custom Embedding Function using sentence-transformers
class HuggingFaceBGEEmbeddings(EmbeddingFunction):
    def __init__(self, model_name="BAAI/bge-small-en-v1.5"):
        print(f"Initializing embedding model: {model_name}...")
        self.model = SentenceTransformer(model_name)
        print("Model initialized successfully.")
    
    def __call__(self, input: Documents) -> Embeddings:
        # Encode documents using the BGE model
        embeddings = self.model.encode(input, normalize_embeddings=True)
        return embeddings.tolist()

def clear_vector_db(db_path: str):
    """Deletes the vector database directory if it exists."""
    if os.path.exists(db_path):
        print(f"Deleting existing vector database at: {db_path}...")
        # Add a short sleep to release any file handles
        time.sleep(0.5)
        try:
            shutil.rmtree(db_path)
            print("Vector database directory deleted.")
        except Exception as e:
            print(f"Warning: Failed to delete directory directly ({e}). Trying to delete contents...")
            for filename in os.listdir(db_path):
                file_path = os.path.join(db_path, filename)
                try:
                    if os.path.isfile(file_path) or os.path.islink(file_path):
                        os.unlink(file_path)
                    elif os.path.isdir(file_path):
                        shutil.rmtree(file_path)
                except Exception as ex:
                    print(f"Failed to delete {file_path}. Reason: {ex}")

def ingest_documents():
    start_time = time.time()
    
    # 2. Rebuild/Delete Vector Database
    clear_vector_db(chroma_abs_path)
    
    # Ensure data directory exists
    os.makedirs(os.path.dirname(chroma_abs_path), exist_ok=True)
    
    # Initialize ChromaDB persistent client and create collection
    client = chromadb.PersistentClient(path=chroma_abs_path)
    embedding_fn = HuggingFaceBGEEmbeddings()
    collection = client.create_collection(
        name="g20_documents",
        embedding_function=embedding_fn
    )
    
    if not KB_DIR.exists():
        print(f"Error: Knowledge base directory does not exist at {KB_DIR}")
        sys.exit(1)
        
    # Recursively find all PDFs
    pdf_files = list(KB_DIR.glob("**/*.pdf"))
    total_pdfs = len(pdf_files)
    
    if total_pdfs == 0:
        print(f"No PDF files found in {KB_DIR}.")
        print("\n--- Ingestion Stats ---")
        print("Total PDFs: 0")
        print("Total Chunks: 0")
        print("Embedding Time: 0.00s")
        print("Success: True")
        return

    print(f"Found {total_pdfs} PDF documents to process.")
    
    # Setup splitter
    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=150)
    
    total_chunks_stored = 0
    
    for pdf_path in pdf_files:
        print(f"\nProcessing PDF: {pdf_path.name}...")
        
        # Determine category based on parent folder name
        # If the parent is Global or India, use that. Otherwise, try to find where it is under knowledge_base.
        category = "Global"
        relative_path = pdf_path.relative_to(KB_DIR)
        parts = relative_path.parts
        if len(parts) > 1:
            category = parts[0]
            
        print(f"Category detected: {category}")
        
        try:
            doc = fitz.open(pdf_path)
        except Exception as e:
            print(f"Failed to read PDF {pdf_path}: {e}")
            continue
            
        document_chunks = []
        document_metadatas = []
        document_ids = []
        
        chunk_index = 0
        
        print("Splitting...")
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            
            # If the page is empty, skip it
            if not text.strip():
                continue
                
            # Split the page text
            page_chunks = splitter.split_text(text)
            
            for page_chunk in page_chunks:
                document_chunks.append(page_chunk)
                
                # Metadata
                # Standard source path relative to knowledge_base
                source_rel = f"knowledge_base/{'/'.join(parts)}"
                
                metadata = {
                    "source": source_rel,
                    "filename": pdf_path.name,
                    "category": category,
                    "page": page_num + 1,  # 1-indexed page
                    "chunk_index": chunk_index
                }
                
                document_metadatas.append(metadata)
                
                # Unique ID for the chunk
                chunk_id = f"{pdf_path.name}_p{page_num + 1}_c{chunk_index}"
                document_ids.append(chunk_id)
                
                chunk_index += 1
                
        if not document_chunks:
            print(f"No text extracted from PDF: {pdf_path.name}")
            continue
            
        print(f"Embedding and storing {len(document_chunks)} chunks...")
        
        # Batch insert to ChromaDB
        # ChromaDB has limits on batch sizes, but for a single PDF it's typically fine.
        # Just to be safe, we can add in smaller batches if needed, but standard is fine.
        collection.add(
            documents=document_chunks,
            metadatas=document_metadatas,
            ids=document_ids
        )
        
        total_chunks_stored += len(document_chunks)
        print(f"Stored {len(document_chunks)} chunks.")
        
    end_time = time.time()
    elapsed_time = end_time - start_time
    
    print("\n--- Ingestion Stats ---")
    print(f"Total PDFs: {total_pdfs}")
    print(f"Total Chunks: {total_chunks_stored}")
    print(f"Embedding Time: {elapsed_time:.2f}s")
    print("Success: True")

if __name__ == "__main__":
    ingest_documents()
