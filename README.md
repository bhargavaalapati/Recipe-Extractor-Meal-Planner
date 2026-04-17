# 🍽️AI Recipe Engine & Meal Planner

> An AI-powered full-stack application that extracts structured recipe data from food blogs, caches results for instant retrieval, and intelligently merges multiple recipes into categorized shopping lists.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [API Reference](#-api-reference)
- [Local Setup & Installation](#️-local-setup--installation)
- [Environment Variables](#-environment-variables)
- [How It Works](#-how-it-works)
- [Defensive Engineering Decisions](#-defensive-engineering-decisions)
- [Project Structure](#-project-structure)
- [Status Codes](#-status-codes)
- [Screenshots](#-screenshots)
- [Future Improvements](#-future-improvements)

---

## 🧠 Overview

**AI Recipe Engine** solves a real-world problem: food blogs are notoriously unstructured — recipes are buried under life stories, SEO padding, and inconsistent formatting. This application uses an LLM pipeline to extract clean, structured recipe data from any food blog URL, persists it in a PostgreSQL database for instant retrieval, and offers an AI meal planner that can merge multiple recipes into a single consolidated, categorized shopping list.

The project demonstrates production-aware engineering: smart caching to protect API rate limits, IP-based throttling to prevent abuse, and a fast-failing UI that communicates errors gracefully via toast notifications.

---

## 🚀 Features

### 🤖 AI Recipe Extraction

- Scrapes raw HTML from any food blog using **BeautifulSoup4**
- Passes cleaned text to **Google Gemini 1.5 Flash** via **LangChain's** `with_structured_output` to guarantee well-typed JSON
- Extracts: ingredients (with quantities & units), step-by-step instructions, nutritional information, cook/prep times, and AI-generated ingredient substitutions

### ⚡ Smart Database Caching

- **PostgreSQL** integration ensures previously extracted URLs are served in milliseconds — no LLM call, no API quota consumed
- On a cache hit, the backend returns a `200 OK` instantly; on a miss, the scraping + LLM pipeline runs and the result is persisted for future requests
- Eliminates redundant API calls, protecting free-tier Gemini quotas

### 🛒 AI Meal Planner

- Select any combination of saved recipes to trigger an intelligent LLM chain
- The model normalizes units (e.g., `2 tbsp` + `1/4 cup` → unified quantity), sums ingredient quantities across recipes, and generates a categorized shopping list (Produce, Dairy, Pantry, Proteins, etc.)
- Output is structured JSON, rendered as a clean, scannable checklist in the UI

### 🛡️ Defensive Engineering

- **IP-based rate limiting** via `slowapi` prevents API abuse and protects free-tier quotas
- **LangChain exponential backoff disabled** — ensures the UI fails fast (with a clear toast notification) rather than hanging silently for 60+ seconds on quota exhaustion
- All API errors surface as user-friendly `4xx`/`5xx` responses with descriptive messages

### 🎨 Modern UI/UX

- Built with **React + Vite** for near-instant HMR during development
- **Tailwind CSS v4** for utility-first styling with zero config overhead
- **Shadcn UI** components for accessible, composable design primitives
- **Skeleton loaders** on every async operation for a polished perceived-performance experience
- **Sonner** toast notifications for real-time success/error feedback

---

## 💻 Tech Stack

| Layer                  | Technology                               |
| ---------------------- | ---------------------------------------- |
| **Frontend Framework** | React 18, TypeScript, Vite               |
| **UI / Styling**       | Tailwind CSS v4, Shadcn UI, Lucide React |
| **Notifications**      | Sonner                                   |
| **Backend Framework**  | Python, FastAPI                          |
| **ORM**                | SQLAlchemy                               |
| **Web Scraping**       | BeautifulSoup4, Requests                 |
| **Rate Limiting**      | SlowAPI                                  |
| **AI / LLM**           | Google Gemini 1.5 Flash                  |
| **LLM Orchestration**  | LangChain (`with_structured_output`)     |
| **Database**           | PostgreSQL 16 (Dockerized)               |
| **Containerization**   | Docker, Docker Compose                   |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│          React + Vite + Tailwind v4 + Shadcn UI             │
│                  http://localhost:5173                       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (JSON)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     FASTAPI BACKEND                         │
│              SlowAPI Rate Limiter (middleware)               │
│                  http://127.0.0.1:8000                      │
│                                                             │
│   ┌──────────────────┐        ┌───────────────────────┐    │
│   │  /extract-recipe  │        │    /meal-planner       │    │
│   │  POST endpoint    │        │    POST endpoint       │    │
│   └────────┬─────────┘        └──────────┬────────────┘    │
│            │                             │                  │
│   ┌────────▼─────────┐        ┌──────────▼────────────┐    │
│   │   Cache Check     │        │  LangChain LLM Chain   │    │
│   │   (SQLAlchemy)    │        │  Unit Normalization    │    │
│   └────────┬─────────┘        │  Category Grouping     │    │
│     Hit ◄──┤──► Miss          └───────────────────────┘    │
│            │                                                 │
│   ┌────────▼─────────┐                                      │
│   │  BeautifulSoup4  │                                      │
│   │  HTML Scraper    │                                      │
│   └────────┬─────────┘                                      │
│            │                                                 │
│   ┌────────▼─────────┐                                      │
│   │  LangChain +     │                                      │
│   │  Gemini 1.5 Flash│                                      │
│   │  (Structured Out)│                                      │
│   └────────┬─────────┘                                      │
└────────────┼────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                   POSTGRESQL (Docker)                       │
│              recipes table — URL as cache key               │
│                    localhost:5432                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📡 API Reference

### `POST /extract-recipe`

Extracts a structured recipe from a food blog URL. Returns cached data if the URL has been previously processed.

**Request Body:**

```json
{
  "url": "https://www.foodblog.com/chocolate-chip-cookies"
}
```

**Response — Cache Hit (`200 OK`):**

```json
{
  "source": "cache",
  "recipe": {
    "title": "Classic Chocolate Chip Cookies",
    "ingredients": [...],
    "instructions": [...],
    "nutrition": {...},
    "substitutions": [...]
  }
}
```

**Response — Cache Miss (`201 Created`):**

```json
{
  "source": "ai_extracted",
  "recipe": { ... }
}
```

---

### `GET /recipes`

Returns all recipes stored in the database.

**Response (`200 OK`):**

```json
[
  {
    "id": 1,
    "url": "https://...",
    "title": "Classic Chocolate Chip Cookies",
    "created_at": "2025-07-05T10:23:00Z"
  }
]
```

---

### `POST /meal-planner`

Accepts a list of recipe IDs and returns a consolidated, categorized shopping list.

**Request Body:**

```json
{
  "recipe_ids": [1, 3, 7]
}
```

**Response (`200 OK`):**

```json
{
  "shopping_list": {
    "Produce": ["3 cloves garlic", "2 medium onions"],
    "Dairy": ["1.5 cups heavy cream", "200g butter"],
    "Pantry": ["2 cups all-purpose flour", "1 tsp baking soda"],
    "Proteins": ["500g chicken breast"]
  }
}
```

---

## 🛠️ Local Setup & Installation

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
- [Node.js](https://nodejs.org/) v18+
- [Python](https://www.python.org/) 3.11+
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey) (free tier works)

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ai-recipe-meal-app-dk.git
cd ai-recipe-meal-app-dk
```

---

### 2. Database Configuration

Ensure Docker is running, then spin up the PostgreSQL container:

```bash
docker-compose up -d
```

Verify the container is healthy:

```bash
docker ps
# You should see recipe_db running on port 5432
```

---

### 3. Backend Setup

Navigate to the `backend` directory and create a virtual environment:

```bash
cd backend
python -m venv venv

# macOS / Linux
source venv/bin/activate

# Windows (PowerShell)
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` folder:

```env
DATABASE_URL=postgresql://recipe_user:recipe_password@localhost:5432/recipe_db
GEMINI_API_KEY=your_google_gemini_api_key_here
```

Start the FastAPI server:

```bash
uvicorn app.main:app --reload
```

> 🟢 Backend running at: **http://127.0.0.1:8000**
> 📄 Interactive API docs: **http://127.0.0.1:8000/docs**

---

### 4. Frontend Setup

Open a **new terminal** and navigate to the `frontend` directory:

```bash
cd frontend
npm install
npm run dev
```

> 🟢 Frontend running at: **http://localhost:5173**

---

## 🔐 Environment Variables

| Variable         | Location       | Description                          |
| ---------------- | -------------- | ------------------------------------ |
| `DATABASE_URL`   | `backend/.env` | PostgreSQL connection string         |
| `GEMINI_API_KEY` | `backend/.env` | Google Gemini API key from AI Studio |

> ⚠️ Never commit `.env` files. They are included in `.gitignore`.

---

## ⚙️ How It Works

### Recipe Extraction Pipeline

```
User submits URL
      │
      ▼
Check PostgreSQL for existing record (cache key = URL)
      │
   ┌──┴──┐
   │ HIT │ ──► Return cached JSON instantly (200 OK, ~5ms)
   └──┬──┘
      │ MISS
      ▼
BeautifulSoup4 fetches + cleans HTML
      │
      ▼
Cleaned text sent to LangChain chain
      │
      ▼
Gemini 1.5 Flash processes with `with_structured_output`
(guarantees typed JSON — no hallucinated schema)
      │
      ▼
Structured recipe stored in PostgreSQL
      │
      ▼
Return extracted recipe to client (201 Created)
```

### Meal Planner Pipeline

```
User selects recipes → POST /meal-planner with [id, id, id]
      │
      ▼
Backend fetches all selected recipes from DB
      │
      ▼
All ingredients passed to LangChain LLM chain
      │
      ▼
Gemini normalizes units + sums quantities + groups by category
      │
      ▼
Structured shopping list returned as JSON
```

---

## 🛡️ Defensive Engineering Decisions

| Decision                               | Rationale                                                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **IP-based rate limiting (`slowapi`)** | Prevents a single user from exhausting the shared Gemini free-tier quota in bulk                                                           |
| **LangChain backoff disabled**         | Default exponential backoff causes 60+ second silent hangs on quota errors. Fail-fast means the UI can show a meaningful error immediately |
| **`with_structured_output`**           | Eliminates JSON parsing errors — the LLM is constrained to emit a valid Pydantic schema, not free-text                                     |
| **Cache-first architecture**           | Identical URLs never hit the LLM twice — instant response, zero quota cost on repeat requests                                              |
| **Skeleton loaders**                   | Async operations always show a loading state — prevents layout shift and communicates progress                                             |

---

## 📁 Project Structure

```
ai-recipe-meal-app-dk/
├── docker-compose.yml          # PostgreSQL service definition
├── README.md
│
├── backend/
│   ├── .env                    # ← create this (gitignored)
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # FastAPI app, route registration, SlowAPI setup
│       ├── models.py           # SQLAlchemy ORM models
│       ├── schemas.py          # Pydantic request/response schemas
│       ├── database.py         # DB session & engine configuration
│       ├── crud.py             # Database read/write operations
│       └── services/
│           ├── scraper.py      # BeautifulSoup4 HTML extraction
│           └── llm.py          # LangChain + Gemini chain definitions
│
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── components/
        │   ├── RecipeExtractor.tsx
        │   ├── RecipeCard.tsx
        │   ├── MealPlanner.tsx
        │   └── ShoppingList.tsx
        └── lib/
            └── api.ts          # Typed fetch wrappers for all endpoints
```

---

## 📊 Status Codes

| Code                        | Endpoint               | Meaning                                   |
| --------------------------- | ---------------------- | ----------------------------------------- |
| `200 OK`                    | `POST /extract-recipe` | Recipe served from cache (instant)        |
| `201 Created`               | `POST /extract-recipe` | Recipe freshly extracted by AI and saved  |
| `200 OK`                    | `GET /recipes`         | All saved recipes returned                |
| `200 OK`                    | `POST /meal-planner`   | Categorized shopping list generated       |
| `422 Unprocessable Entity`  | Any                    | Request body validation failed (Pydantic) |
| `429 Too Many Requests`     | Any                    | IP rate limit exceeded (SlowAPI)          |
| `500 Internal Server Error` | `POST /extract-recipe` | Scraping failed or Gemini API error       |

---

## 📸 Screenshots

> _Add screenshots of your running application here._

| Recipe Extractor | Saved Recipes  | Meal Planner   |
| ---------------- | -------------- | -------------- |
| _(screenshot)_   | _(screenshot)_ | _(screenshot)_ |

---

## 🔭 Future Improvements

- [ ] **User Authentication** — JWT-based auth so users have private recipe collections
- [ ] **Recipe Search** — Full-text search across titles and ingredients (PostgreSQL `tsvector`)
- [ ] **Scheduled Re-extraction** — Detect when a cached recipe URL has been updated and re-run the pipeline
- [ ] **Export to PDF** — One-click shopping list PDF export
- [ ] **Dietary Filters** — Filter meal plans by dietary restriction (vegan, gluten-free, etc.)
- [ ] **Unit Tests** — Pytest suite for scraper, LLM chain, and CRUD layers
- [ ] **CI/CD** — GitHub Actions pipeline for lint, test, and Docker build on PR

---

## 📄 License

This project was built as part of the **My Job's** assessment. All rights reserved.

---

<div align="center">
  <strong>Built with ❤️ using FastAPI · LangChain · Gemini · React · PostgreSQL</strong>
</div>
