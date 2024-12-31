from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel
import fitz  # PyMuPDF
import numpy as np
import faiss
import google.generativeai as genai

class QuestionRequest(BaseModel):
    question: str

# Initialize FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Sentence Transformer model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Initialize FAISS index
dimension = 384  # Dimension of embeddings
index = faiss.IndexFlatL2(dimension)

# Store metadata (text, page numbers, PDF names)
metadata = []

# Configure Gemini API
genai.configure(api_key="AIzaSyAHyeFtSu-gWyLtNYpe5JFMuih1HYgIrXw")
model2 = genai.GenerativeModel("gemini-1.5-flash")
# chat = model2.start_chat(
# history=[
# {"role": "model", "parts": "You are a helpful assistant that generates multiple search queries based on a single input query."},
# {"role": "user", "parts": f"Generate multiple search queries related to: "},
# ]
# )
# response = chat.send_message("OUTPUT (4 queries):")
# print(response.text)
@app.post("/upload")
async def upload_pdf(files: list[UploadFile] = File(...)):
    for file in files:
        if not file.filename.endswith(".pdf"):
            raise HTTPException(status_code=400, detail="Only PDF files are allowed")

        # Extract text and metadata from PDF
        text_chunks = []
        pdf_metadata = []
        with fitz.open(stream=await file.read(), filetype="pdf") as doc:
            for page_num, page in enumerate(doc):
                text = page.get_text()
                text_chunks.append(text)
                pdf_metadata.append({"text": text, "page": page_num + 1, "file": file.filename})

        # Generate embeddings
        embeddings = model.encode(text_chunks)

        # Add embeddings to FAISS index
        index.add(np.array(embeddings))

        # Store metadata
        metadata.extend(pdf_metadata)

    return {"message": "PDFs uploaded successfully", "total_pages": len(metadata)}


@app.post("/ask")
async def ask_question(request: QuestionRequest):
    question = request.question

    # Generate embedding for the question
    question_embedding = model.encode([question])

    # Search for relevant text chunks
    k = 3  # Retrieve top 3 chunks
    distances, indices = index.search(np.array(question_embedding), k)

    # Combine relevant text chunks into a single context
    relevant_texts = [metadata[i]["text"] for i in indices[0]]
    context = " ".join(relevant_texts)

    # Generate a single answer using the combined context
    prompt = f"Context: {context}\n\nQuestion: {question}"
    response = model2.generate_content(prompt)
    answer = response.text

    # Prepare citations (page numbers and file names)
    citations = [{"page": metadata[i]["page"], "file": metadata[i]["file"]} for i in indices[0]]

    # Return the answer with citations
    return {"question": question, "answer": answer, "citations": citations}