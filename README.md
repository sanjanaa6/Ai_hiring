# 🤖 AI-Powered Hiring & Recruitment Platform

An end-to-end recruitment platform built with the **MERN stack** that leverages Artificial Intelligence to streamline the hiring process—from automated resume screening and candidate matching to AI-assisted video/technical interview evaluations.

---

## 🚀 Features

### 🏢 For Recruiters & Employers
* **Job Management:** Post, edit, and track job openings with customizable skill and experience requirements.
* **AI Candidate Matching:** Automatically score and rank applicants based on resume relevancy and job description match.
* **Automated Screening:** Set up AI-driven preliminary questionnaires and automated initial assessments.
* **Analytics Dashboard:** Gain insights into applicant funnels, time-to-hire metrics, and sourcing channels.

### 👤 For Candidates
* **Smart Application Process:** One-click application with automatic resume parsing (Extracting skills, experience, and education).
* **AI Resume Feedback:** Get real-time feedback on how well your resume matches a given job post.
* **Interview Prep & Practice:** Practice AI mock interviews with automated feedback on communication and technical clarity.

---

## 🛠️ Tech Stack

* **Frontend:** React.js, Redux / Context API, Tailwind CSS / Material UI
* **Backend:** Node.js, Express.js
* **Database:** MongoDB, Mongoose ORM
* **AI / ML Integration:** OpenAI API (GPT-4) / Hugging Face / LangChain for NLP & resume analysis
* **Authentication:** JSON Web Tokens (JWT) & OAuth 2.0
* **Storage:** AWS S3 / Cloudinary (for storing candidate resumes and media files)

---

## 📂 Project Structure

```text
ai-hiring-project/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI Components
│   │   ├── pages/          # Application views (Dashboard, Jobs, Interviews)
│   │   ├── context/        # State Management
│   │   └── utils/          # API helpers and formatting
│   └── package.json
│
├── server/                 # Express & Node.js Backend
│   ├── config/             # DB Connection & Environment Setup
│   ├── controllers/        # Route Handlers (Auth, Jobs, AI Services)
│   ├── models/             # MongoDB Schemas (User, Job, Application)
│   ├── routes/             # API Endpoints
│   ├── services/           # AI Integration & Resume Parsing Logic
│   └── package.json
│
└── README.md
