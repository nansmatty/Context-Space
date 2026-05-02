# ContextSpace

> An AI-powered RAG (Retrieval-Augmented Generation) system for intelligent document querying

[![AWS](https://img.shields.io/badge/AWS-Serverless-orange)](https://aws.amazon.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9+-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

## 📋 Overview

ContextSpace is a serverless, scalable RAG system that enables users to upload documents, process them into semantic embeddings, and query them using natural language. Built on AWS infrastructure, it leverages Amazon Bedrock for embeddings and language model capabilities, providing accurate answers based on document context.

**Current Status:** MVP Complete (Backend Only)  
**Future Roadmap:** User authentication, team workspaces, collaborative features

---

## 🏗️ Architecture

```
┌─────────────┐
│   Backend   │──────▶  S3 Bucket (upload/)
│   Express   │         │
└─────────────┘         │ S3 Event Trigger
                        ▼
                   ┌────────────────┐
                   │ Ingestion      │──────▶ Parse PDF/TXT
                   │ Lambda         │        Chunk Text
                   └────────────────┘
                        │
                        ▼
                   ┌────────────────┐
                   │ SQS Queue 1    │
                   │ (Embeddings)   │
                   └────────────────┘
                        │
                        ▼
                   ┌────────────────┐
                   │ Embeddings     │──────▶ Amazon Bedrock
                   │ Lambda         │        (Titan Embeddings)
                   └────────────────┘
                        │
                        ▼
                   ┌────────────────┐
                   │ SQS Queue 2    │
                   │ (DB Insertion) │
                   └────────────────┘
                        │
                        ▼
                   ┌────────────────┐
                   │ DB Insertion   │──────▶ Aurora PostgreSQL
                   │ Lambda         │        (pgvector)
                   └────────────────┘

┌─────────────┐
│ API Gateway │──────▶ Retrieval Lambda ──────▶ Vector Search
│  POST /ask  │        │                         (Similarity)
└─────────────┘        │
                       ▼
                  Amazon Bedrock ──────▶ Answer Generation
                  (OpenAI GPT)
```

---

## 🚀 Features

### Current (MVP)

- **Document Upload**: Upload PDF and TXT files via REST API
- **Intelligent Parsing**: Extract text from documents using optimized parsers
- **Text Chunking**: Split documents into semantic chunks for processing
- **Vector Embeddings**: Generate 1024-dimensional embeddings using Amazon Titan
- **Vector Storage**: Store embeddings in Aurora PostgreSQL with pgvector extension
- **Similarity Search**: Fast cosine similarity search for relevant chunks
- **Natural Language Q&A**: Ask questions and get AI-generated answers with source attribution
- **Scalable Pipeline**: Event-driven architecture with SQS for reliable processing

### Planned (Future)

- User authentication and authorization
- Team-based workspaces
- Collaborative document management
- Advanced search filters
- Document versioning
- Analytics dashboard

---

## 🛠️ Tech Stack

### Backend

- **Runtime**: Node.js 22.x
- **Framework**: Express.js
- **Language**: TypeScript 6.0+
- **Database (Metadata)**: MongoDB with Mongoose
- **File Upload**: Multer
- **Logging**: Winston

### Infrastructure

- **IaC**: AWS CDK (TypeScript)
- **Cloud Provider**: AWS
  - **Compute**: AWS Lambda (Node.js 22.x)
  - **Storage**: Amazon S3
  - **Database**: Aurora PostgreSQL Serverless v2 (with pgvector)
  - **Queue**: Amazon SQS
  - **API**: API Gateway
  - **AI/ML**: Amazon Bedrock
    - Embeddings: `amazon.titan-embed-text-v2:0` (1024-dim)
    - LLM: `openai.gpt-oss-20b-1:0`
  - **Networking**: VPC, Security Groups
  - **Secrets**: AWS Secrets Manager

### Document Processing

- **Parsers**: unpdf, pdf-parse
- **Canvas Rendering**: @napi-rs/canvas

---

## 📂 Project Structure

```
context-space/
├── backend/              # Express API server
│   ├── src/
│   │   ├── app.ts       # Express app configuration
│   │   ├── server.ts    # Server entry point
│   │   ├── config/      # Database configuration
│   │   ├── middlewares/ # Error handling
│   │   ├── modules/     # Feature modules (auth, document)
│   │   ├── services/    # S3 service integration
│   │   └── utils/       # Utilities and error handlers
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── package.json
│
├── infra/               # AWS CDK infrastructure code
│   ├── bin/
│   │   └── infra.ts    # CDK app entry point
│   ├── lib/
│   │   ├── service-constructs/  # Reusable constructs
│   │   │   ├── database-construct.ts
│   │   │   ├── lambda-constructs.ts
│   │   │   ├── s3-bucket-construct.ts
│   │   │   └── sqs-queue-construct.ts
│   │   └── stack/
│   │       └── infra-stack.ts   # Main stack definition
│   ├── cdk.json
│   └── package.json
│
└── lambdas/             # Lambda function handlers
    ├── src/
    │   ├── db/
    │   │   ├── db.ts
    │   │   ├── run-migrations.ts
    │   │   └── migrations/      # SQL migration files
    │   ├── ingestion-handler/   # S3 event processor
    │   ├── embeddings-handler/  # Generate embeddings
    │   ├── db-insertation-handler/ # Store in PostgreSQL
    │   ├── retrieval-handler/   # Question answering
    │   ├── migration-handler/   # Database migration executor
    │   ├── services/
    │   │   ├── bedrock.service.ts
    │   │   ├── parser.service.ts
    │   │   └── retrieval.service.ts
    │   └── utils/
    └── package.json
```

---

## 🔧 Prerequisites

- **Node.js**: v22.x or higher
- **AWS Account**: With appropriate permissions
- **AWS CLI**: Configured with credentials
- **AWS CDK**: v2.232.2+
- **Docker**: (Optional, for local backend development)
- **MongoDB**: (For backend metadata storage)
- **TypeScript**: v5.9+

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd context-space
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Lambda Dependencies

```bash
cd ../lambdas
npm install
```

### 4. Install Infrastructure Dependencies

```bash
cd ../infra
npm install
```

---

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/contextspace

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# S3
S3_BUCKET_NAME=your-bucket-name

# Server
PORT=5601
```

### Lambda Environment Variables

Lambda environment variables are automatically configured by CDK during deployment:

- `EMBEDDINGS_QUEUE_URL`: SQS queue for embeddings processing
- `DATABASE_DATA_QUEUE_URL`: SQS queue for database insertion
- `DB_SECRET_ARN`: Secrets Manager ARN for database credentials
- `AWS_REGION`: AWS region (auto-configured)

---

## 🚀 Deployment

### Deploy Infrastructure with AWS CDK

1. **Bootstrap CDK (First-time only)**

```bash
cd infra
cdk bootstrap
```

2. **Build the Infrastructure**

```bash
npm run build
```

3. **Deploy the Stack**

```bash
# Deploy with VPC endpoints (recommended for production)
cdk deploy

# Deploy without VPC endpoints (faster for development)
cdk deploy -c enableVpcEndpoints=false
```

4. **Run Database Migrations**
   After deployment, invoke the migration Lambda to set up database schema:

```bash
aws lambda invoke \
  --function-name <MigrationLambdaName> \
  --region us-east-1 \
  response.json
```

### Deploy Backend (Docker)

```bash
cd backend
docker-compose up -d
```

Or run locally:

```bash
npm run dev
```

---

## 📖 API Documentation

### Base URL

```
http://localhost:5601/api
```

### Endpoints

#### 1. Upload Document

**POST** `/documents/upload`

Upload a PDF or TXT document for processing.

**Request:**

- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `file`: File (PDF or TXT, max 10MB)

**Response:**

```json
{
	"success": true,
	"uploadData": "https://s3.amazonaws.com/...",
	"key": "upload/abc123-document.pdf"
}
```

**Status Codes:**

- `200`: Success
- `400`: Invalid file type or no file provided
- `500`: Server error

---

#### 2. Ask a Question

**POST** `/ask` (via API Gateway)

Query documents using natural language.

**Request:**

```json
{
	"question": "What is the main topic of the document?",
	"workspace_id": "workspace_123",
	"user_id": "user_456"
}
```

**Response:**

```json
{
	"message": "Answer generated successfully",
	"data": {
		"question": "What is the main topic of the document?",
		"answer": "The main topic discusses...",
		"sources": [
			{
				"document_id": "uuid",
				"chunk_index": 2,
				"similarity": 0.87
			}
		]
	}
}
```

**Status Codes:**

- `200`: Success
- `400`: Missing required fields
- `500`: Server error

---

## 🔄 Processing Pipeline

### 1. Document Ingestion

- User uploads document via backend API
- File stored in S3 with metadata (documentId)
- S3 event triggers **Ingestion Lambda**

### 2. Text Extraction & Chunking

- Parse PDF/TXT content
- Split text into semantic chunks (~500 words)
- Send chunks to **Embeddings Queue**

### 3. Embedding Generation

- **Embeddings Lambda** consumes messages from SQS
- Generate 1024-dimensional vectors using Amazon Titan
- Send to **Database Queue**

### 4. Vector Storage

- **DB Insertion Lambda** stores chunks and embeddings
- PostgreSQL with pgvector extension enables similarity search

### 5. Question Answering

- User sends question via API Gateway
- **Retrieval Lambda**:
  1. Generate question embedding
  2. Perform cosine similarity search
  3. Retrieve top 5 relevant chunks
  4. Generate answer using OpenAI GPT with context
  5. Return answer with source attribution

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
```

### Chunks Table

```sql
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
```

---

## 🧪 Development

### Run Backend Locally

```bash
cd backend
npm run dev
```

### Build Backend

```bash
npm run build
```

### Run Lambda Functions Locally

```bash
cd lambdas
npm run run:migrations  # Run database migrations
```

### CDK Commands

```bash
cd infra
cdk diff          # Compare deployed stack with current state
cdk synth         # Synthesize CloudFormation template
cdk deploy        # Deploy stack to AWS
cdk destroy       # Destroy stack
```

---

## 🔐 Security Considerations

- **VPC**: Lambdas run in private subnets with VPC endpoints
- **Secrets Manager**: Database credentials stored securely
- **IAM Roles**: Least-privilege access for all resources
- **Security Groups**: Network isolation between services
- **File Validation**: Only PDF and TXT files allowed (max 10MB)
- **CORS**: Configured in backend for controlled access

> ⚠️ **Note**: Authentication and authorization are planned for future releases.

---

## 🐛 Known Issues & Limitations

- No user authentication (MVP phase)
- `user_id` and `workspace_id` are placeholders in ingestion
- No frontend interface
- Limited to PDF and TXT documents
- Maximum file size: 10MB
- No real-time processing status updates

---

## 🛣️ Roadmap

- [ ] User authentication and authorization
- [ ] Team-based workspace management
- [ ] Frontend web application
- [ ] Real-time processing status
- [ ] Support for more document types (DOCX, PPTX, etc.)
- [ ] Advanced search filters
- [ ] Document versioning
- [ ] Analytics and usage dashboard
- [ ] Rate limiting and quota management
- [ ] Comprehensive API documentation (Swagger/OpenAPI)

---

## 📝 License

ISC

---

## 👤 Author

**Narayan Maity**

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

## ⚡ Quick Start Summary

```bash
# 1. Install dependencies
cd backend && npm install
cd ../lambdas && npm install
cd ../infra && npm install

# 2. Configure environment variables
cp backend/.env.example backend/.env  # Edit with your values

# 3. Deploy infrastructure
cd infra
cdk bootstrap  # First time only
cdk deploy -c enableVpcEndpoints=false

# 4. Run migrations
aws lambda invoke --function-name <MigrationLambdaName> response.json

# 5. Start backend
cd ../backend
npm run dev

# 6. Upload a document
curl -X POST http://localhost:5601/api/documents/upload \
  -F "file=@document.pdf"

# 7. Ask a question (via API Gateway URL from CDK output)
curl -X POST <API_GATEWAY_URL>/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What is this about?","workspace_id":"ws1","user_id":"u1"}'
```

---

**Built with ❤️ using AWS and TypeScript**
