# Form Submission Round Feature

## Overview
The Form Submission Round feature allows recruiters to create custom forms (similar to Google Forms) that candidates can fill out as part of the interview process. This feature provides a flexible way to collect structured information from candidates.

## Features

### For Recruiters
1. **Create Form Submission Rounds**: Add form submission rounds to interviews
2. **Design Custom Forms**: Create forms with various field types:
   - Text Input
   - Text Area
   - Email
   - Number
   - Date
   - Dropdown (Select)
   - Radio Buttons
   - Checkboxes
   - File Upload
3. **Field Validation**: Set validation rules for each field:
   - Required/Optional
   - Min/Max length for text fields
   - Min/Max values for number fields
   - Regex patterns
4. **Form Management**: Edit, reorder, and delete form fields
5. **View Submissions**: See all candidate form submissions with detailed analytics
6. **Download Files**: Download files uploaded by candidates

### For Candidates
1. **Multi-step Form**: Forms are displayed in steps for better UX
2. **Real-time Validation**: Immediate feedback on field validation
3. **File Upload**: Upload documents as part of form submission
4. **Progress Tracking**: Visual progress bar showing completion status
5. **Responsive Design**: Works on desktop and mobile devices

## Technical Implementation

### Backend Components

#### 1. Database Schema (Interview.js)
```javascript
// Form field schema
const formFieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['text', 'textarea', 'select', 'radio', 'checkbox', 'email', 'number', 'date', 'file'], 
    required: true 
  },
  label: { type: String, required: true },
  placeholder: { type: String },
  required: { type: Boolean, default: false },
  options: [{ type: String }], // For select, radio, checkbox
  validation: {
    minLength: { type: Number },
    maxLength: { type: Number },
    min: { type: Number },
    max: { type: Number },
    pattern: { type: String } // Regex pattern
  },
  order: { type: Number, required: true }
});

// Form submission schema
const formSubmissionSchema = new mongoose.Schema({
  candidateId: { type: String, required: true },
  candidateName: { type: String, required: true },
  candidateEmail: { type: String, required: true },
  roundId: { type: String, required: true },
  responses: [{
    fieldId: { type: String, required: true },
    fieldType: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    submittedAt: { type: Date, default: Date.now }
  }],
  submittedAt: { type: Date, default: Date.now },
  isComplete: { type: Boolean, default: false }
});
```

#### 2. API Endpoints (formSubmission.js)
- `POST /api/interviews/submit-form` - Submit form data
- `POST /api/interviews/upload-form-file` - Upload files for form fields
- `GET /api/interviews/round/:roundId/submissions` - Get form submissions for a round
- `GET /api/interviews/submission/:submissionId` - Get specific form submission
- `GET /api/interviews/download/:filename` - Download uploaded files
- `GET /api/interviews/round/:roundId/stats` - Get form submission statistics

### Frontend Components

#### 1. FormFieldManager.js
- Manages form field creation and editing
- Supports drag-and-drop reordering
- Field type selection with icons
- Validation rule configuration
- Real-time preview

#### 2. FormSubmissionRound.js
- Candidate-facing form interface
- Multi-step form navigation
- Real-time validation
- File upload handling
- Progress tracking
- Responsive design

#### 3. FormSubmissionViewer.js
- Recruiter view of form submissions
- Statistics dashboard
- Search and filter functionality
- Detailed submission view
- File download capabilities

#### 4. InterviewRoundRouter.js
- Routes to appropriate component based on round type
- Handles form submission, file upload, and interview rounds

## Usage Guide

### Creating a Form Submission Round

1. **Add New Round**:
   - Click "Add Round" in the Interview Reviewer
   - Select "Form Submission Round (Custom Forms)"
   - Enter round title and description

2. **Design Form Fields**:
   - Click "Add Field" to create form fields
   - Choose field type from the available options
   - Configure field properties:
     - Label and placeholder text
     - Required/Optional status
     - Validation rules
     - Options for select/radio/checkbox fields

3. **Reorder Fields**:
   - Use the up/down arrows to reorder fields
   - Fields are displayed in the order they appear in the form

### Candidate Form Submission

1. **Access Form**: Candidates receive a link to the form submission round
2. **Fill Form**: Complete fields step by step with real-time validation
3. **Upload Files**: Upload required documents if file fields are present
4. **Submit**: Review and submit the completed form

### Viewing Submissions (Recruiters)

1. **Access Submissions**: Navigate to the form submission round
2. **View Statistics**: See completion rates and submission counts
3. **Browse Submissions**: Search and filter candidate submissions
4. **View Details**: Click on any submission to see detailed responses
5. **Download Files**: Download files uploaded by candidates

## File Structure

```
frontend/src/
├── components/
│   ├── FormSubmissionRound.js      # Candidate form interface
│   └── InterviewRoundRouter.js     # Round type router
├── recruiter/components/
│   ├── FormFieldManager.js         # Form field management
│   ├── FormSubmissionViewer.js     # Submission viewing
│   └── InterviewReviewer.js        # Updated with form support
└── services/
    └── apiService.js               # API integration

backend/
├── models/
│   └── Interview.js                # Updated schema
├── routes/
│   └── formSubmission.js           # Form submission API
└── uploads/
    └── form-submissions/           # File storage
```

## Configuration

### File Upload Settings
- Maximum file size: 10MB
- Allowed file types: jpeg, jpg, png, gif, pdf, doc, docx, txt, rtf
- Storage location: `backend/uploads/form-submissions/`

### Form Validation
- Text fields: Min/max length, regex patterns
- Number fields: Min/max values
- Email fields: Built-in email validation
- Required fields: Enforced on submission

## Security Considerations

1. **File Upload Security**:
   - File type validation
   - File size limits
   - Secure file storage
   - Virus scanning (recommended for production)

2. **Data Validation**:
   - Server-side validation for all form data
   - SQL injection prevention
   - XSS protection

3. **Access Control**:
   - Authentication required for form submission
   - Recruiter-only access to submission data
   - Secure file download endpoints

## Future Enhancements

1. **Advanced Field Types**:
   - Rating scales
   - Date ranges
   - Multi-file uploads
   - Rich text editors

2. **Form Templates**:
   - Pre-built form templates
   - Industry-specific forms
   - Custom form themes

3. **Analytics**:
   - Response time tracking
   - Drop-off analysis
   - Field completion rates

4. **Integration**:
   - Export to CSV/Excel
   - Integration with ATS systems
   - Email notifications

## Troubleshooting

### Common Issues

1. **File Upload Fails**:
   - Check file size (max 10MB)
   - Verify file type is allowed
   - Ensure upload directory exists

2. **Form Validation Errors**:
   - Check field validation rules
   - Verify required fields are filled
   - Test regex patterns

3. **Submission Not Saving**:
   - Check network connection
   - Verify API endpoints are accessible
   - Check browser console for errors

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in the backend environment.

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.
