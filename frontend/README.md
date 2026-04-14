# Frontend

React + TypeScript client. Talks to Supabase for all data operations and to the FastAPI ML service for pricing intelligence.

## Stack

- **React 18** + TypeScript
- **Vite** — dev server and bundler
- **Supabase JS client** — auth, PostgREST queries, Realtime subscriptions
- **Recharts** — pricing report visualizations
- **React Router** — client-side routing

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

## Setup Instructions

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the `frontend` root directory and add the required variables. Usually this includes:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_ML_SERVICE_URL=http://localhost:8000 # Default local ML service port
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173` by default.

## Build for Production

To build the application for production deployment:
```bash
npm run build
```

To preview the production build locally:
```bash
npm run preview
```