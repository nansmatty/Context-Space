# ContextSpace

> A backend-focused AI/RAG system for intelligent document querying (MVP)

[![AWS](https://img.shields.io/badge/AWS-Serverless-orange)](https://aws.amazon.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

## 📋 Overview

ContextSpace is a production-style learning project implementing a serverless RAG (Retrieval-Augmented Generation) system. Users can upload documents (PDF/TXT), which are automatically processed into semantic embeddings and stored for intelligent querying using natural language.

**Current Status:** MVP Complete (Backend + Infrastructure Only)  
**Stage:** Backend RAG pipeline stabilized and operational  
**Not Yet Implemented:** Frontend UI, authentication system, team workspaces, permission management

This is a backend-focused learning project built to understand production AWS serverless architectures and RAG systems at scale.

## ⚠️ Note

This project is intentionally backend-focused.
The current MVP prioritizes distributed document processing,
retrieval quality, and AWS infrastructure design before frontend development.

---

## 🏗️ Architecture

### Upload Flow

```
Frontend/API Client
    │
    ▼
Backend Upload API (Express)
    │
    ▼
S3 Bucket (upload/{documentId}/)
    │ S3 Event Trigger
    ▼
Ingestion Lambda
    │ • Extract text from PDF/TXT
    │ • Chunk into ~500 word segments
    │ • Generate chunk messages
    ▼
SQS Queue (Embeddings)
    │
    ▼
Embeddings Lambda
    │ • Generate 1024-dim vectors
    │ • Amazon Bedrock Titan Embeddings
    ▼
SQS Queue (DB Insertion)
    │
    ▼
DB Insertion Lambda
    │ • Store chunks + embeddings
    │ • Insert into Aurora PostgreSQL
    │ • Send finalizer message
    ▼
SQS Queue (Finalizer)
    │
    ▼
Finalizer Lambda
    │ • Verify all chunks inserted
    │ • Update document status
    └─▶ Aurora PostgreSQL (pgvector)
```

### Ask Flow

```
Frontend/API Client
    │
    ▼
Backend Ask Proxy API (Express)
    │
    ▼
API Gateway → Retrieval Lambda
    │ • Generate question embedding (Titan)
    │ • pgvector similarity search (top_k=3, threshold≥0.25)
    │ • Retrieve relevant chunks
    │ • Build context from matches
    ▼
Amazon Bedrock (GPT-OSS-20B)
    │ • Generate answer from context
    │ • Or return "no relevant context" fallback
    ▼
Response: Answer + Sources
```

---

## 🎯 Design Decisions

### Document Identity Propagation

Each document is assigned a unique `document_id` (UUID) at upload time in the backend. This ID flows through the entire pipeline:

- **Backend**: Generates UUID and embeds in S3 key: `upload/{documentId}/{filename}`
- **S3 Metadata**: Stored as `documentid` metadata field
- **Ingestion Lambda**: Extracts from S3 key or metadata
- **SQS Messages**: Included in all queue messages
- **Database**: Used as foreign key in chunks table

This ensures end-to-end traceability and consistent document association across all stages.

### Finalizer Pattern

The finalizer Lambda implements a verification pattern to ensure data consistency:

- **Problem**: Chunks are inserted asynchronously; how to know when a document is fully processed?
- **Solution**: DB Insertion Lambda sends a finalizer message after each chunk. Finalizer Lambda counts inserted chunks and marks document `completed` only when `inserted_count == expected_chunk_count`.
- **Benefit**: Prevents marking documents complete prematurely or with missing chunks.

### Retrieval Quality Controls

To balance recall and precision:

- **`top_k = 3`**: Retrieve top 3 most similar chunks (limits context size)
- **`similarity_threshold = 0.25`**: Filter out chunks with similarity < 0.25 (on 0-1 scale)
- **Fallback Response**: If no chunks pass threshold, return "No relevant context found" instead of hallucinating

This prevents the LLM from generating answers when no relevant information exists.

### Status-Based Processing

Documents have explicit lifecycle states:

- **`uploaded`**: Initial state (currently unused, set at ingestion)
- **`processing`**: Chunks being generated and embedded
- **`completed`**: All chunks inserted and verified
- **`failed`**: Processing error at any stage

Failed documents include `error_message` field with stage and details (e.g., `"ingestion: Unsupported file type"`).

---

## 📊 Document Lifecycle

```
┌────────────┐
│  uploaded  │  ← Document lands in S3
└─────┬──────┘
      │
      ▼
┌────────────┐
│ processing │  ← Ingestion → Embeddings → DB Insertion
└─────┬──────┘
      │
      ├─▶ ┌────────┐
      │   │ failed │  ← Error at any stage
      │   └────────┘     (error_message recorded)
      │
      ▼
┌────────────┐
│ completed  │  ← Finalizer verifies all chunks inserted
└────────────┘
```

**Key Points:**

- Only `completed` documents are included in retrieval queries
- `failed` documents store stage and error for debugging
- Finalizer Lambda ensures atomic completion (all chunks present)

---

## 🚀 Features

### Current (MVP Backend)

- ✅ **Document Upload API**: REST endpoint for PDF/TXT upload (max 10MB)
- ✅ **Intelligent Parsing**: Extract text from PDFs (unpdf) and plain text files
- ✅ **Text Chunking**: Split documents into ~500 word semantic chunks
- ✅ **Vector Embeddings**: Generate 1024-dim embeddings using Amazon Bedrock Titan
- ✅ **Vector Storage**: Aurora PostgreSQL with pgvector extension
- ✅ **Similarity Search**: Cosine similarity search with quality thresholds
- ✅ **Natural Language Q&A**: GPT-OSS-20B via Amazon Bedrock with source attribution
- ✅ **Event-Driven Pipeline**: SQS queues for reliable, scalable processing
- ✅ **Document Lifecycle Management**: Status tracking (processing/completed/failed)
- ✅ **Finalizer Queue**: Verification of chunk insertion before completion
- ✅ **Input Validation**: Zod schemas for API requests and queue messages
- ✅ **Retrieval Quality Controls**: Similarity thresholds and no-context fallback
- ✅ **Backend Ask Proxy**: Express endpoint forwards to API Gateway

### Not Yet Implemented

- ❌ User authentication and authorization
- ❌ Team-based workspace management
- ❌ Frontend web application
- ❌ Real-time processing status tracking
- ❌ Advanced search filters
- ❌ Document versioning
- ❌ Analytics dashboard

---

## 🛠️ Tech Stack

### Backend

- **Runtime**: Node.js 22.x
- **Framework**: Express.js
- **Language**: TypeScript 5.9+
- **Validation**: Zod
- **Logging**: Winston
- **File Upload**: Multer

### Infrastructure (AWS)

- **IaC**: AWS CDK (TypeScript)
- **Compute**: AWS Lambda (Node.js 22.x)
- **Storage**: Amazon S3
- **Database**: Aurora PostgreSQL Serverless v2 with pgvector extension
- **Queue**: Amazon SQS (3 queues: Embeddings, DB Insertion, Finalizer)
- **API**: API Gateway (Retrieval endpoint)
- **AI/ML**: Amazon Bedrock
  - Embeddings: `amazon.titan-embed-text-v2:0` (1024-dim)
  - LLM: `openai.gpt-oss-20b-1:0`
- **Networking**: VPC, Private Subnets, Security Groups, VPC Endpoints
- **Secrets**: AWS Secrets Manager (DB credentials)

### Lambda Handlers

- **Ingestion Handler**: S3 event → Parse → Chunk → Send to Embeddings Queue
- **Embeddings Handler**: SQS → Generate embeddings → Send to DB Queue
- **DB Insertion Handler**: SQS → Store chunks + embeddings → Send to Finalizer Queue
- **Finalizer Handler**: SQS → Verify chunk count → Mark document completed/failed
- **Retrieval Handler**: API Gateway → Similarity search → Generate answer
- **Migration Handler**: Execute SQL migrations on deployment

### Document Processing

- **PDF Parser**: unpdf
- **Text Parser**: Buffer → UTF-8 string
- **Chunking**: Custom ~500 word chunker with overlap

---

## 📂 Project Structure

```
context-space/
├── backend/                    # Express API server
│   ├── src/
│   │   ├── app.ts             # Express app configuration
│   │   ├── server.ts          # Server entry point
│   │   ├── config/
│   │   │   └── dbConfig.ts    # MongoDB config (for future metadata)
│   │   ├── middlewares/
│   │   │   └── error-middleware.ts
│   │   ├── modules/
│   │   │   ├── auth/          # (empty - planned)
│   │   │   └── document/
│   │   │       ├── document.controller.ts  # Upload & Ask endpoints
│   │   │       └── document.routes.ts
│   │   ├── services/
│   │   │   └── s3.services.ts # S3 upload with document_id
│   │   └── utils/
│   │       ├── global-error-handler.ts
│   │       └── logger.ts      # Winston logger
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── package.json
│
├── infra/                     # AWS CDK infrastructure
│   ├── bin/
│   │   └── infra.ts          # CDK app entry
│   ├── lib/
│   │   ├── service-constructs/
│   │   │   ├── database-construct.ts       # Aurora PostgreSQL + pgvector
│   │   │   ├── lambda-constructs.ts        # All 6 Lambda functions
│   │   │   ├── s3-bucket-construct.ts      # Upload bucket + events
│   │   │   └── sqs-queue-construct.ts      # 3 SQS queues
│   │   └── stack/
│   │       └── infra-stack.ts # Main stack (orchestrates all constructs)
│   ├── cdk.json
│   └── package.json
│
└── lambdas/                   # Lambda function code
    ├── src/
    │   ├── db/
    │   │   ├── db.ts          # PostgreSQL client creation
    │   │   ├── run-migrations.ts
    │   │   └── migrations/
    │   │       ├── 001_create_documents_table.sql
    │   │       ├── 002_create_chunks_table.sql
    │   │       └── 003_alter_chunks_table_200426.sql
    │   ├── ingestion-handler/
    │   │   └── index.ts       # S3 → Parse → Chunk → Queue
    │   ├── embeddings-handler/
    │   │   └── index.ts       # Queue → Bedrock embeddings → Queue
    │   ├── db-insertation-handler/
    │   │   └── index.ts       # Queue → Insert chunks → Finalizer message
    │   ├── finalizer-data-handler/
    │   │   └── index.ts       # Verify chunks → Mark document completed
    │   ├── retrieval-handler/
    │   │   └── index.ts       # API Gateway → Similarity search → Answer
    │   ├── migration-handler/
    │   │   └── index.ts       # Execute SQL migrations
    │   ├── services/
    │   │   ├── bedrock.service.ts    # Embeddings + LLM generation
    │   │   ├── parser.service.ts     # PDF/TXT parsing
    │   │   └── retrieval.service.ts  # pgvector similarity search
    │   └── utils/
    │       ├── general-utils.ts      # Vector conversion, ID extraction
    │       ├── ingestion-utils.ts    # Chunking, stream handling
    │       ├── shared_types.ts       # TypeScript types for messages
    │       └── validation.ts         # Zod schemas
    └── package.json
```

---

## 🔧 Prerequisites

- **Node.js**: v22.x or higher
- **AWS Account**: With appropriate permissions (Lambda, S3, Aurora, Bedrock, etc.)
- **AWS CLI**: Configured with credentials
- **AWS CDK**: v2.232.2+
- **Docker**: (Optional, for local backend development)
- **TypeScript**: v5.9+

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd context-space
```

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Lambdas
cd ../lambdas
npm install

# Infrastructure
cd ../infra
npm install
```

---

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# AWS Configuration
AWS_REGION=us-east-1

# S3 Bucket (must match deployed infrastructure)
S3_BUCKET_NAME=your-bucket-name

# API Gateway URL (from CDK output after deployment)
ASK_API_GATEWAY_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/prod/ask

# MongoDB (planned for future user/workspace metadata)
MONGO_URI=mongodb://localhost:27017/contextspace

# Server
PORT=5601
```

**Important**: After deploying infrastructure with CDK, copy the API Gateway URL from the stack outputs and set it as `ASK_API_GATEWAY_URL`.

### Lambda Environment Variables

Lambda environment variables are automatically configured by CDK during deployment:

- `EMBEDDINGS_QUEUE_URL`: SQS queue for embeddings processing
- `DATABASE_DATA_QUEUE_URL`: SQS queue for database insertion
- `FINALIZER_QUEUE_URL`: SQS queue for finalizer verification
- `DB_SECRET_ARN`: Secrets Manager ARN for Aurora credentials
- `AWS_REGION`: AWS region (auto-configured)

---

## 🚀 Deployment

### Step 1: Deploy Infrastructure with AWS CDK

#### First-time Setup

```bash
cd infra
cdk bootstrap
```

#### Build and Deploy

```bash
npm run build

# Deploy with VPC endpoints (recommended for production)
cdk deploy

# OR deploy without VPC endpoints (faster for development, lower cost)
cdk deploy -c enableVpcEndpoints=false
```

**Note**: Deployment takes 5-10 minutes. Aurora Serverless v2 cluster creation is the slowest part.

#### Capture Stack Outputs

After deployment, CDK will output:

- `InfraStack.ApiGatewayUrl` → Use this for `ASK_API_GATEWAY_URL` in backend `.env`
- `InfraStack.S3BucketName` → Use this for `S3_BUCKET_NAME` in backend `.env`

### Step 2: Run Database Migrations

After deployment, invoke the migration Lambda to set up the database schema:

```bash
aws lambda invoke \
  --function-name InfraStack-MigrationHandler \
  --region us-east-1 \
  response.json

cat response.json  # Verify migration success
```

### Step 3: Deploy Backend

#### Using Docker

```bash
cd backend
docker-compose up -d
```

#### Or Run Locally

```bash
cd backend
npm run dev
```

Backend will start on `http://localhost:5601`.

---

## 📖 API Documentation

### Base URL (Backend)

```
http://localhost:5601/api
```

---

### 1. Upload Document

**POST** `/documents/upload`

Upload a PDF or TXT document for processing.

**Request:**

- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Body**:
  - `file`: File (PDF or TXT, max 10MB)

**Example (curl):**

```bash
curl -X POST http://localhost:5601/api/documents/upload \
  -F "file=@/path/to/document.pdf"
```

**Response (Success):**

```json
{
	"success": true,
	"uploadData": "https://your-bucket.s3.us-east-1.amazonaws.com/upload/abc-123-uuid/document.pdf",
	"key": "upload/abc-123-uuid/document.pdf"
}
```

**Status Codes:**

- `200`: Success
- `400`: Invalid file type or no file provided
- `500`: Server error

---

### 2. Ask a Question

**POST** `/documents/ask`

Query uploaded documents using natural language. Backend proxies to API Gateway retrieval Lambda.

**Request:**

- **Method**: `POST`
- **Content-Type**: `application/json`
- **Body**:

```json
{
	"question": "What is the main topic of the document?",
	"workspace_id": "workspace_123",
	"user_id": "user_456"
}
```

**Validation Rules:**

- `question`: 1-1000 characters
- `workspace_id`: Required, non-empty string
- `user_id`: Required, non-empty string

**Example (curl):**

```bash
curl -X POST http://localhost:5601/api/documents/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the main topic?",
    "workspace_id": "ws1",
    "user_id": "u1"
  }'
```

**Response (Success with Context):**

```json
{
	"message": "Answer generated successfully",
	"data": {
		"question": "What is the main topic?",
		"answer": "The document discusses serverless architecture patterns...",
		"sources": [
			{
				"document_id": "abc-123-uuid",
				"chunk_index": 2,
				"similarity": 0.87
			},
			{
				"document_id": "abc-123-uuid",
				"chunk_index": 5,
				"similarity": 0.76
			}
		]
	}
}
```

**Response (No Relevant Context):**

```json
{
	"message": "No relevant context found for the question",
	"data": {
		"question": "What is quantum computing?",
		"answer": "I couldn't find relevant information in your documents to answer this question.",
		"sources": []
	}
}
```

**Status Codes:**

- `200`: Success (even if no context found)
- `400`: Missing or invalid required fields
- `500`: Server error

---

## 🔄 Processing Pipeline Details

### 1. Document Ingestion

1. User uploads document via backend API (`POST /documents/upload`)
2. Backend generates `document_id` (UUID)
3. File uploaded to S3 at `upload/{documentId}/{filename}`
4. S3 event triggers **Ingestion Lambda**

### 2. Text Extraction & Chunking

1. **Ingestion Lambda** downloads file from S3
2. Extracts `document_id` from S3 key or metadata
3. Parses content (PDF via unpdf, TXT as UTF-8)
4. Splits text into chunks (~500 words with overlap)
5. Sends each chunk to **Embeddings Queue** as separate message

### 3. Embedding Generation

1. **Embeddings Lambda** polls **Embeddings Queue**
2. For each message:
   - Validates using Zod schema
   - Generates 1024-dim vector using Amazon Bedrock Titan
   - Sends to **DB Insertion Queue**

### 4. Vector Storage

1. **DB Insertion Lambda** polls **DB Insertion Queue**
2. For each message:
   - Inserts chunk + embedding into Aurora PostgreSQL `chunks` table
   - After insertion, sends **Finalizer Queue** message with document metadata

### 5. Document Finalization

1. **Finalizer Lambda** polls **Finalizer Queue**
2. For each message:
   - **If type = `DOCUMENT_PROCESSING_FAILED`**: Marks document `failed` with error details
   - **If type = `DOCUMENT_FINALIZE_CHECK`**:
     - Counts inserted chunks for `document_id`
     - If `inserted_count == expected_chunk_count`: Marks document `completed`
     - If not: Skips (waits for more chunks)

### 6. Question Answering

1. User sends question via backend (`POST /documents/ask`)
2. Backend proxies to **API Gateway**
3. **Retrieval Lambda**:
   - Validates request using Zod
   - Generates question embedding (Titan)
   - Performs cosine similarity search in pgvector
   - Filters results by similarity threshold (≥0.25)
   - If no results: Returns fallback "no relevant context" response
   - If results found: Builds context from top 3 chunks
   - Sends context + question to Bedrock GPT-OSS-20B
   - Returns answer + source attribution

---

## 🗄️ Database Schema

### Documents Table

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(64) NOT NULL,
  workspace_id VARCHAR(64) NOT NULL,
  s3_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  status VARCHAR(30) NOT NULL DEFAULT 'uploaded',
  chunk_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_workspace_id ON documents (workspace_id);
CREATE INDEX idx_documents_user_id ON documents (user_id);
CREATE INDEX idx_documents_status ON documents (status);
```

**Status Values:**

- `uploaded`: Initial state (unused in current MVP)
- `processing`: Chunks being generated
- `completed`: All chunks inserted and verified
- `failed`: Error during processing (see `error_message`)

### Chunks Table

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id VARCHAR(64) NOT NULL,
  workspace_id VARCHAR(64) NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER,
  embedding VECTOR(1024),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, chunk_index)
);

CREATE INDEX idx_chunks_workspace_id ON chunks (workspace_id);
CREATE INDEX idx_chunks_user_id ON chunks (user_id);
CREATE INDEX idx_chunks_document_id ON chunks (document_id);
```

**Note**: Vector similarity index should be added for production performance (see IMPROVEMENTS_SUGGESTIONS.txt).

---

## 🧪 Development

### Run Backend Locally

```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:5601` with hot reload.

### Build Backend

```bash
cd backend
npm run build
```

### Test Lambda Function Locally

```bash
cd lambdas

# Build TypeScript
npm run build

# Run migrations locally (requires AWS credentials)
npm run run:migrations
```

### CDK Commands

```bash
cd infra

# Show differences between deployed and local stack
cdk diff

# Synthesize CloudFormation template
cdk synth

# Deploy stack
cdk deploy

# Destroy stack (WARNING: deletes all resources)
cdk destroy
```

---

## 🔐 Security Considerations

- **VPC Isolation**: Lambdas run in private subnets with no internet access (unless VPC endpoints enabled)
- **Secrets Manager**: Aurora credentials stored securely, injected into Lambdas at runtime
- **IAM Roles**: Least-privilege access for all resources (S3, SQS, Aurora, Bedrock, Secrets Manager)
- **Security Groups**: Network isolation between Lambda and Aurora
- **File Validation**: Only PDF and TXT files allowed, max 10MB enforced by Multer
- **CORS**: Enabled in backend (currently permissive, should restrict origins in production)
- **No Hardcoded Credentials**: S3 client uses AWS SDK default credential provider chain

> ⚠️ **Note**: Authentication and authorization are NOT implemented. All endpoints are currently public. Do not deploy to production without implementing auth.

---

## 📊 Current Status

### ✅ Completed (MVP Scope)

- [x] Backend upload API with document_id generation
- [x] S3 upload with metadata propagation
- [x] Ingestion Lambda (parse + chunk)
- [x] Embeddings Lambda (Bedrock Titan)
- [x] DB Insertion Lambda (Aurora + pgvector)
- [x] Finalizer Lambda (verification pattern)
- [x] Retrieval Lambda (similarity search + LLM)
- [x] Backend Ask proxy endpoint
- [x] Document lifecycle status tracking (processing/completed/failed)
- [x] Failed document error handling
- [x] Retrieval quality controls (top_k, threshold, fallback)
- [x] Zod validation for API and queue messages
- [x] Database connection cleanup in retrieval service
- [x] AWS CDK infrastructure as code
- [x] PostgreSQL migration system

### 🚧 In Progress

- [ ] User authentication system
- [ ] Frontend web application

### 📅 Planned (Future Phases)

- [ ] Team-based workspace management
- [ ] Permission system (workspace-level access control)
- [ ] Real-time processing status tracking
- [ ] Support for more document types (DOCX, PPTX, MD)
- [ ] Document versioning
- [ ] Advanced search filters (date range, document type, etc.)
- [ ] Analytics dashboard
- [ ] Rate limiting and quota management

---

## ⚠️ Known Limitations

### MVP Constraints

- **No Authentication**: All endpoints are public. `user_id` and `workspace_id` are passed as request parameters with no verification.
- **Hardcoded Placeholders**: Ingestion Lambda uses `'unknown'` for `user_id` and `workspace_id` (will be extracted from S3 metadata in future).
- **No Real-Time Status**: No WebSocket or polling mechanism to track document processing progress.
- **Basic Retrieval**: Uses simple cosine similarity. No hybrid search, reranking, or advanced RAG techniques.
- **No Retry UI**: Failed documents are marked in database but no user-facing retry mechanism.
- **No Connection Pooling**: Each Lambda creates new PostgreSQL connection (performance impact at scale).
- **Sequential SQS Sending**: Ingestion sends messages one at a time (slow for large documents).
- **No Vector Index**: Similarity search performs full table scan (slow with many chunks).

### Technical Debt

See `IMPROVEMENTS_SUGGESTIONS.txt` for prioritized list of improvements.

---

## 🛣️ Future Improvements

### Phase 1: Authentication & Frontend

- [ ] JWT-based authentication system
- [ ] User registration and login
- [ ] Frontend React/Next.js application
- [ ] Real-time processing status with WebSocket or Server-Sent Events

### Phase 2: Multi-Tenancy

- [ ] Workspace creation and management
- [ ] Team invitation system
- [ ] Role-based access control (Owner, Editor, Viewer)
- [ ] Workspace-level document isolation

### Phase 3: Performance & Scale

- [ ] PostgreSQL connection pooling in Lambdas
- [ ] Vector similarity index (IVFFlat or HNSW)
- [ ] Batch SQS message sending
- [ ] CloudFront CDN for S3 uploads
- [ ] Aurora read replicas for retrieval queries

### Phase 4: Advanced RAG

- [ ] Hybrid search (vector + keyword)
- [ ] Reranking with cross-encoder models
- [ ] Multi-query retrieval strategies
- [ ] Contextual compression
- [ ] Citation extraction with exact quotes

### Phase 5: Enterprise Features

- [ ] Document versioning with diff tracking
- [ ] Audit logs for compliance
- [ ] Analytics dashboard (usage, costs, query patterns)
- [ ] Rate limiting and quota management per workspace
- [ ] Export functionality (answers, sources, documents)
- [ ] Comprehensive API documentation (Swagger/OpenAPI)

---

## 📝 License

ISC

---

## 👤 Author

**Narayan Maity**

---

## 🤝 Contributing

This is a learning project, but contributions, issues, and feature requests are welcome!

---

## ⚡ Quick Start Summary

```bash
# 1. Install all dependencies
cd backend && npm install
cd ../lambdas && npm install
cd ../infra && npm install

# 2. Deploy infrastructure
cd infra
cdk bootstrap  # First time only
cdk deploy -c enableVpcEndpoints=false

# 3. Run database migrations
aws lambda invoke \
  --function-name InfraStack-MigrationHandler \
  --region us-east-1 \
  response.json

# 4. Configure backend .env
# Copy API Gateway URL and S3 bucket name from CDK outputs
# Set ASK_API_GATEWAY_URL and S3_BUCKET_NAME

# 5. Start backend
cd ../backend
npm run dev

# 6. Upload a document
curl -X POST http://localhost:5601/api/documents/upload \
  -F "file=@document.pdf"

# 7. Wait ~10-30 seconds for processing

# 8. Ask a question
curl -X POST http://localhost:5601/api/documents/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is this document about?",
    "workspace_id": "unknown",
    "user_id": "unknown"
  }'
```

---

## 📚 Additional Documentation

- **Architecture Deep Dive**: See `lambdaConstructCodeForPDFParser.txt` for PDF parsing implementation notes
- **Code Improvements**: See `IMPROVEMENTS_SUGGESTIONS.txt` for prioritized technical improvements
- **Context Commands**: See `context_commands.txt` for development workflow notes

---

**Built as a production-style learning project to understand AWS serverless architecture, RAG systems, and event-driven design patterns at scale.**
