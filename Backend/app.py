import os
import logging
import datetime
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
from langchain_groq import ChatGroq

# Initialize Flask app
app = Flask(__name__)
# Configure CORS with explicit support for methods and headers
CORS(app, resources={
    r"/api/*": {
        "origins": "http://localhost:5173",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure upload folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Global variables to store conversation state
conversation = None
chat_history = []

# Function to check allowed file extensions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Function to extract text from PDF files
def get_pdf_text(pdf_paths):
    text = ""
    for pdf_path in pdf_paths:
        logging.info(f"Extracting text from {pdf_path}")
        try:
            with open(pdf_path, 'rb') as f:
                pdf_reader = PdfReader(f)
                for page in pdf_reader.pages:
                    page_text = page.extract_text() or ""
                    text += page_text
        except Exception as e:
            logging.error(f"Error extracting text from {pdf_path}: {e}")
            raise
    return text

# Function to split the extracted text into chunks
def get_text_chunks(text):
    logging.info("Splitting text into chunks")
    try:
        text_splitter = CharacterTextSplitter(
            separator="\n",
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        chunks = text_splitter.split_text(text)
        logging.info(f"Created {len(chunks)} chunks")
        return chunks
    except Exception as e:
        logging.error(f"Error splitting text: {e}")
        raise

# Function to create a FAISS vectorstore
def get_vectorstore(text_chunks):
    logging.info("Creating FAISS vectorstore")
    try:
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'}  # Force CPU to avoid GPU memory issues
        )
        # Process chunks in smaller batches to reduce memory usage
        batch_size = 100
        vectorstore = None
        for i in range(0, len(text_chunks), batch_size):
            batch = text_chunks[i:i + batch_size]
            logging.info(f"Processing batch {i // batch_size + 1} with {len(batch)} chunks")
            if vectorstore is None:
                vectorstore = FAISS.from_texts(texts=batch, embedding=embeddings)
            else:
                vectorstore.add_texts(batch)
        return vectorstore
    except Exception as e:
        logging.error(f"Error creating vectorstore: {e}")
        raise

# Function to set up the conversational retrieval chain
def get_conversation_chain(vectorstore):
    logging.info("Setting up conversation chain")
    try:
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.5, api_key=groq_api_key)
        memory = ConversationBufferMemory(memory_key='chat_history', return_messages=True)
        
        conversation_chain = ConversationalRetrievalChain.from_llm(
            llm=llm,
            retriever=vectorstore.as_retriever(),
            memory=memory
        )
        logging.info("Conversation chain created successfully")
        return conversation_chain
    except Exception as e:
        logging.error(f"Error creating conversation chain: {e}")
        return None

# Endpoint to upload and process PDFs
@app.route('/api/upload', methods=['POST', 'OPTIONS'])
def upload_pdfs():
    if request.method == 'OPTIONS':
        return jsonify({}), 200  # Handle CORS preflight request
    
    global conversation, chat_history
    logging.info("Received upload request")
    chat_history = []
    
    if 'files' not in request.files:
        logging.error("No files provided")
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.files.getlist('files')
    pdf_paths = []
    
    for file in files:
        if file and allowed_file(file.filename):
            if file.seek(0, os.SEEK_END) > MAX_FILE_SIZE:
                file.seek(0)
                logging.error(f"File {file.filename} exceeds 10MB limit")
                return jsonify({'error': f'File {file.filename} exceeds 10MB limit'}), 400
            file.seek(0)
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            pdf_paths.append(file_path)
        else:
            logging.error(f"Invalid file type: {file.filename}")
            return jsonify({'error': 'Invalid file type'}), 400
    
    try:
        raw_text = get_pdf_text(pdf_paths)
        text_chunks = get_text_chunks(raw_text)
        vectorstore = get_vectorstore(text_chunks)
        conversation = get_conversation_chain(vectorstore)
        
        if conversation is None:
            logging.error("Failed to create conversation chain")
            return jsonify({'error': 'Failed to create conversation chain'}), 500
        
        logging.info("PDFs processed successfully")
        return jsonify({'message': 'PDFs processed successfully'}), 200
    except Exception as e:
        logging.error(f"Error processing PDFs: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        # Clean up uploaded files
        for file_path in pdf_paths:
            try:
                os.remove(file_path)
                logging.info(f"Removed uploaded file: {file_path}")
            except Exception as e:
                logging.error(f"Error removing file {file_path}: {e}")

# Endpoint to handle user questions
@app.route('/api/ask', methods=['POST', 'OPTIONS'])
def ask_question():
    if request.method == 'OPTIONS':
        return jsonify({}), 200  # Handle CORS preflight request
    
    global conversation, chat_history
    logging.info("Received question request")
    
    if conversation is None:
        logging.error("No documents processed yet")
        return jsonify({'error': 'No documents processed yet'}), 400
    
    data = request.get_json()
    if not data or 'question' not in data or 'token' not in data:
        logging.error("No question or token provided")
        return jsonify({'error': 'No question or token provided'}), 400
    
    user_question = data['question']
    token = data['token']  # JWT from frontend
    
    try:
        # Add system message to format response with markdown
        formatted_question = {
            "system": "Format your response using markdown with bold titles, proper line breaks, bullet points, numbered lists, and code blocks where appropriate.",
            "human": user_question
        }
        
        response = conversation({
            'question': f"{formatted_question['system']}\n\nUser Question: {formatted_question['human']}"
        })
        chat_history = response['chat_history']
        
        formatted_history = []
        for i, message in enumerate(chat_history):
            role = 'user' if i % 2 == 0 else 'bot'
            content = message.content
            
            # For user messages, only keep the actual question (remove system prompt)
            if role == 'user':
                content = user_question
                
            formatted_history.append({
                'role': role,
                'content': content,
                'timestamp': str(datetime.datetime.now())
            })
        
        # Send chat history to Node.js backend
        node_backend_url = "http://localhost:3000/api/chats/save"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
        payload = {
            "history": formatted_history,
            "chatId": data.get('chatId')  # Optional: include chatId if provided
        }
        
        node_response = requests.post(node_backend_url, json=payload, headers=headers)
        if node_response.status_code != 200:
            logging.error(f"Failed to save chat to Node.js backend: {node_response.text}")
            return jsonify({'error': 'Failed to save chat history'}), 500
        
        logging.info("Question processed and chat saved successfully")
        return jsonify({
            'chat_history': formatted_history,
            'chatId': node_response.json().get('chatId'),
            'metadata': {
                'processed_at': str(datetime.datetime.now()),
                'has_markdown': True
            }
        }), 200
    except Exception as e:
        logging.error(f"Error processing question: {e}")
        return jsonify({'error': str(e)}), 500

# Health check endpoint
@app.route('/api/health', methods=['GET', 'OPTIONS'])
def health():
    if request.method == 'OPTIONS':
        return jsonify({}), 200  # Handle CORS preflight request
    
    logging.info("Health check requested")
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)  # Disable auto-reload