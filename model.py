from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_google_genai import GoogleGenerativeAI
import os
import sys
from langchain_community.document_loaders import PyPDFLoader

# Set Google API key
os.environ['GOOGLE_API_KEY'] = "AIzaSyCC7wHwqsTnKT4Z22IXmZOp_Z7jZkGATYM"

# Initialize the language model with Gemini-pro
llm = ChatGoogleGenerativeAI(model='gemini-pro', temperature=0.7)

# Required imports for processing text
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain.embeddings import HuggingFaceEmbeddings

# Extract command-line arguments
PATH = sys.argv[1]
TOPIC = sys.argv[2]
NUMBER_OF_QUESTIONS = int(sys.argv[3])
QUESTION_TYPE = sys.argv[4].lower()

# Load PDF
pdfLoader = PyPDFLoader(f"{PATH}")
mydocuments = pdfLoader.load()

# Split the document into chunks
text_splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=100)
texts = text_splitter.split_documents(mydocuments)

# Create embeddings using HuggingFace
embeddings = HuggingFaceEmbeddings(model_name='sentence-transformers/all-mpnet-base-v2')

# Build a vector database from documents
vectordb = FAISS.from_documents(documents=texts, embedding=embeddings)
retriever = vectordb.as_retriever(search_kwargs={'k': 15})

# Define prompt templates based on the type of questions
if QUESTION_TYPE == "mcqs":
    # MCQs prompt template
    prompt_template = f"""
    Create {NUMBER_OF_QUESTIONS} Multiple Choice Questions (MCQs) on the topic "{TOPIC}" based on the text: {{context}}.
    Provide the correct answers directly after the options without any additional explanations or text. The format should be:

    1. Question text
       a) Option 1
       b) Option 2
       c) Option 3
       d) Option 4
       Answer: a, b, c, or d

    Negative prompt: do not add any * or ** anywhere in the question or options.
    """
elif QUESTION_TYPE == "true/false":
    # True/False prompt template
    prompt_template = f"""
    Create {NUMBER_OF_QUESTIONS} True/False questions on the topic "{TOPIC}" based on the text: {{context}}.
    Provide the correct answers directly after the questions in the format:

    1. Question text
       Answer: True or False

    Negative prompt: no additional explanations or symbols.
    """
else:
    # Mixed questions (MCQs + True/False) prompt template
    prompt_template = f"""
    Create {NUMBER_OF_QUESTIONS // 2} Multiple Choice Questions (MCQs) and {NUMBER_OF_QUESTIONS // 2} True/False questions on the topic "{TOPIC}" based on the text: {{context}}.
    Provide the correct answers directly after the questions in the respective formats:

    MCQs:
    1. Question text
       a) Option 1
       b) Option 2
       c) Option 3
       d) Option 4
       Answer: a, b, c, or d

    True/False:
    1. Question text
       Answer: True or False

    Negative prompt: do not add any * or ** anywhere in the questions, options, or answers.
    """

# Set up the prompt template and the retrieval-based QA chain
from langchain.prompts import PromptTemplate
from langchain.chains import RetrievalQA

PROMPT = PromptTemplate(template=prompt_template, input_variables=["context"])
chain_type_kwargs = {"prompt": PROMPT}

# Initialize the RetrievalQA chain
chain = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=retriever, input_key="query", return_source_documents=False, chain_type_kwargs=chain_type_kwargs)

# Generate questions
result = chain(f"{TOPIC}")

# Output the result
print(result['result'])
