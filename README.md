# Zen Quiz (Chinese Learning Web Application)

A web application designed for interactive Chinese language learning and quiz practice.

## Project Structure

```text
Chinese_Web_app/
├── backend/          # FastAPI Python backend
│   ├── app/          # API logic, models, schemas, and endpoints
│   ├── .env.example  # Example environment configuration
│   └── requirements.txt
└── frontend/         # React + Vite frontend
    ├── src/          # Components, pages, and assets
    └── package.json
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## License

MIT
