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

## Deployment & Hosting Instructions

When hosting the app online (e.g., Render, Vercel, Netlify):

1. **Backend Service**:
   - Host the `backend` folder on a service like Render (Python Web Service), Railway, or Fly.io.
   - Environment variables needed on backend:
     - `SECRET_KEY`: Random secret key for JWT authentication.
     - `CORS_ORIGINS`: Set to `*` or your frontend site URL (e.g. `https://zen-quiz-frontend.onrender.com`).
     - `DATABASE_URL`: `sqlite:///./zen_quiz.db` or PostgreSQL connection string.

2. **Frontend Static Site**:
   - Host the `frontend` folder on Render (Static Site), Vercel, Netlify, or Cloudflare Pages.
   - Set the build environment variable:
     - `VITE_API_URL`: Your deployed backend URL (e.g., `https://zen-quiz-backend.onrender.com`).
   - If hosting both on Render using `render.yaml`, the included route rewrite automatically proxies `/api/*` requests to the backend service.

## License

MIT
