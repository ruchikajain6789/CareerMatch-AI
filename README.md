# CareerMatch AI

**An AI-powered job search and resume matching platform.**

CareerMatch AI helps job seekers discover relevant opportunities, analyse their resumes, and understand how closely their experience matches job requirements.

The application combines real job listings with local AI-based semantic matching to support a more informed job search.

## Features

### 1. Job Search
- Search job opportunities using the Himalayas Jobs API.
- Explore remote job opportunities.
- Filter opportunities by available search criteria.
- Open original job listings to view application details.

### 2. Resume Analysis
- Upload resumes in PDF and DOCX formats.
- Extract resume content locally.
- Generate a professional summary.
- Identify key skills and experience.
- Review basic resume structure and areas for improvement.

### 3. AI Resume Matching
- Compare resume content against job descriptions.
- Use a locally hosted Sentence Transformers model.
- Calculate semantic similarity between resume and job descriptions.
- Display skill coverage and AI semantic similarity separately.

**Note:** Semantic similarity is an indicator of textual relevance, not a definitive measure of job suitability.

### 4. Saved Jobs
- Save interesting job opportunities.
- Access saved jobs for future reference.
- Store saved jobs locally in the browser.

### 5. Application Tracker
- Track jobs manually marked as applied.
- View saved application records.
- Monitor the number of applications submitted.

### 6. Gmail Integration
- Gmail integration is planned for a future release.
- Currently not connected or available.

## Technology Stack

**Frontend**
- React
- TypeScript
- Vite
- CSS

**Backend**
- Python
- FastAPI
- Uvicorn

**AI and NLP**
- Sentence Transformers
- all-MiniLM-L6-v2
- PyTorch
- Cosine Similarity

**Other Tools**
- Himalayas Jobs API
- PDF.js
- Mammoth.js
- Local Storage

## Project Structure

```text
CareerMatch-AI/
│
├── public/
├── src/
│   ├── assets/
│   ├── services/
│   │   ├── himalayasJobs.ts
│   │   ├── resumeMatcher.ts
│   │   └── resumeText.ts
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
│
├── backend.py
├── package.json
├── package-lock.json
├── index.html
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js
- npm
- Python 3.11 or later

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Navigate to the project

```bash
cd CareerMatch-AI
```

### 3. Install frontend dependencies

```bash
npm install
```

### 4. Start the frontend

```bash
npm run dev
```

Open the local development URL displayed in the terminal.

### 5. Set up the Python backend

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```bash
.venv\Scripts\activate
```

Install the backend dependencies using the project's `requirements.txt` file once available:

```bash
pip install -r requirements.txt
```

Start the backend:

```bash
uvicorn backend:app --reload --port 8000
```

The AI semantic matching service runs locally through the FastAPI backend.

## Privacy

- Resume extraction is performed locally in the browser.
- Resume content is not intentionally sent to an external AI service.
- AI semantic matching uses a locally hosted model through the Python backend.
- Saved jobs and application records are stored in browser local storage.
- Gmail integration is not currently enabled.

## Current Limitations

- Job availability depends on the external job data source.
- Job search coverage varies by location and listing availability.
- AI semantic similarity should not be interpreted as an overall suitability score.
- Application tracking currently relies on manually marking jobs as applied.
- Gmail integration is planned for a future version.

## Future Enhancements

- Gmail-based application tracking.
- Additional job data sources.
- Improved job and resume matching.
- Enhanced application status tracking.
- Additional resume insights.

## Project Status

CareerMatch AI is an evolving portfolio project focused on AI-assisted job discovery, resume analysis, and career support.

---

**Built as an independent AI product project.**