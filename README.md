# My Recipe Extractor & Meal Planner

An AI-powered full-stack application that extracts structured recipe data from blog URLs and generates intelligent meal plans.

## Tech Stack

- **Frontend:** React, Vite, Tailwind v4, Shadcn UI (Native Fetch API)
- **Backend:** Python, FastAPI, SQLAlchemy, BeautifulSoup4
- **AI Engine:** LangChain + Google Gemini 2.5 Flash
- **Database:** PostgreSQL (Dockerized)

## Setup Instructions

1. **Database:** Run `docker-compose up -d` to start PostgreSQL.
2. **Backend:** \* Navigate to `/backend`.
   - Create a `.env` file with `DATABASE_URL` and `GEMINI_API_KEY`.
   - Build/Run the docker container OR use the local venv: `pip install -r requirements.txt` then `uvicorn app.main:app --reload`.
3. **Frontend:** \* Navigate to `/frontend`.
   - Run `npm install` and `npm run dev`.

## Features

- Extracts ingredients, instructions, and cook times via HTML scraping and LLM parsing.
- Generates realistic AI ingredient substitutions and nutritional estimates.
- Select multiple recipes in the History tab to generate a merged, categorized shopping list.
