# Jobs Module

This module contains all job-related functionality for the AI Hiring platform, including job posting, searching, and application management.

## Structure

```
jobs/
├── components/           # Shared components
│   ├── JobCard.js       # Job display card component
│   ├── JobFilters.js    # Advanced job filtering component
│   ├── JobApplicationForm.js  # Job application form modal
│   └── AIJobPrompt.js   # AI-powered job description generator
├── user/                # User-facing components
│   └── JobSearch.js     # Job search and browsing interface
├── recruiter/           # Recruiter-specific components
│   ├── JobCreate.js     # Job creation form with AI assistance
│   └── JobManagement.js # Job management dashboard
├── index.js            # Module exports
└── README.md           # This file
```

## Features

### For Recruiters

#### AI-Powered Job Creation
- **AI Job Prompt**: Generate compelling job descriptions using AI
- **Smart Templates**: Quick-start templates for common roles
- **Content Generation**: Automatically generate requirements, skills, and benefits
- **Copy & Paste**: Easy copying of generated content

#### Job Management
- **Dashboard**: Overview of all job postings with statistics
- **Status Management**: Activate, pause, or close job postings
- **Application Tracking**: Monitor application counts and status
- **Search & Filter**: Find jobs by title, status, or date
- **Bulk Actions**: Manage multiple jobs efficiently

### For Job Seekers

#### Enhanced Job Search
- **Advanced Filters**: Filter by location, salary, experience, company size
- **Smart Search**: Search by keywords, skills, or company names
- **Save Jobs**: Bookmark interesting positions
- **Application Tracking**: Track application status

#### Application Process
- **Streamlined Forms**: Easy-to-use application forms
- **Portfolio Integration**: Link to resumes, portfolios, and LinkedIn
- **Cover Letter**: Rich text editor for cover letters
- **Status Updates**: Real-time application status updates

## Components

### JobCard
Displays job information in a card format with:
- Job title, company, and location
- Job type and experience level badges
- Salary information
- Required skills
- Application count
- Action buttons (Apply, Save, View Details)

### JobFilters
Advanced filtering component with:
- Text search
- Job type selection
- Location filtering
- Experience level
- Salary range
- Company size
- Posted date

### JobApplicationForm
Modal form for job applications including:
- Contact information
- Cover letter
- Resume/CV upload
- Portfolio links
- Expected salary
- Availability
- Additional information

### AIJobPrompt
AI-powered job description generator with:
- Role and company input
- Industry and experience level selection
- Key requirements specification
- Company culture description
- Benefits and perks
- Generated content preview
- Copy-to-clipboard functionality

## API Endpoints

The components expect the following API endpoints:

### Jobs
- `GET /api/jobs` - List jobs with filters
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create new job (recruiters)
- `PATCH /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `GET /api/jobs/recruiter` - Get recruiter's jobs

### Applications
- `POST /api/applications` - Submit job application
- `GET /api/applications` - Get user's applications
- `GET /api/applications/job/:jobId` - Get job applications (recruiters)

### AI Services
- `POST /api/ai/generate-job` - Generate job description using AI

## Usage

### Importing Components

```javascript
import { 
  JobSearch, 
  JobManagement, 
  JobCreate,
  JobCard,
  JobFilters,
  JobApplicationForm,
  AIJobPrompt 
} from './jobs';
```

### Basic Job Search

```javascript
import { JobSearch } from './jobs';

function JobsPage() {
  return <JobSearch />;
}
```

### Job Creation with AI

```javascript
import { JobCreate } from './jobs';

function CreateJobPage() {
  return <JobCreate />;
}
```

### Custom Job Card

```javascript
import { JobCard } from './jobs';

function CustomJobList({ jobs }) {
  return (
    <div>
      {jobs.map(job => (
        <JobCard 
          key={job.id}
          job={job}
          onApply={(jobId) => handleApply(jobId)}
          onSave={(jobId) => handleSave(jobId)}
          isSaved={savedJobs.has(job.id)}
        />
      ))}
    </div>
  );
}
```

## Styling

All components use Tailwind CSS classes and follow the design system defined in the main application. Key classes used:

- `card` - Card container styling
- `btn` - Button styling variants
- `form-input`, `form-select`, `form-textarea` - Form element styling
- `btn-primary`, `btn-secondary`, `btn-outline` - Button variants

## State Management

Components use React Query for server state management and local state for UI interactions:

- Job data fetching and caching
- Application submission
- Filter state management
- Form state handling

## Responsive Design

All components are fully responsive and work on:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## Accessibility

Components include:
- Proper ARIA labels
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast compliance
