import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Save, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Type,
  List,
  Radio,
  CheckSquare,
  Mail,
  Hash,
  Calendar,
  Upload,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

const FormSubmissionRound = ({ round, onComplete, candidateInfo, isDarkMode }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState({});

  const stepsPerPage = 5; // Show 5 fields per page
  const totalSteps = Math.ceil((round.formFields?.length || 0) / stepsPerPage);
  const currentFields = round.formFields?.slice(
    currentStep * stepsPerPage, 
    (currentStep + 1) * stepsPerPage
  ) || [];

  useEffect(() => {
    // Initialize form data with empty values
    const initialData = {};
    round.formFields?.forEach(field => {
      if (field.type === 'checkbox') {
        initialData[field.id] = [];
      } else {
        initialData[field.id] = '';
      }
    });
    setFormData(initialData);
  }, [round.formFields]);

  const validateField = (field, value) => {
    const fieldErrors = [];

    // Required field validation
    if (field.required) {
      if (field.type === 'checkbox') {
        if (!value || value.length === 0) {
          fieldErrors.push('This field is required');
        }
      } else if (!value || value.toString().trim() === '') {
        fieldErrors.push('This field is required');
      }
    }

    // Type-specific validation
    if (value && value.toString().trim() !== '') {
      if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          fieldErrors.push('Please enter a valid email address');
        }
      }

      if (field.type === 'number') {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          fieldErrors.push('Please enter a valid number');
        } else {
          if (field.validation?.min !== null && numValue < field.validation.min) {
            fieldErrors.push(`Value must be at least ${field.validation.min}`);
          }
          if (field.validation?.max !== null && numValue > field.validation.max) {
            fieldErrors.push(`Value must be at most ${field.validation.max}`);
          }
        }
      }

      if (['text', 'textarea', 'email'].includes(field.type)) {
        const strValue = value.toString();
        if (field.validation?.minLength && strValue.length < field.validation.minLength) {
          fieldErrors.push(`Minimum length is ${field.validation.minLength} characters`);
        }
        if (field.validation?.maxLength && strValue.length > field.validation.maxLength) {
          fieldErrors.push(`Maximum length is ${field.validation.maxLength} characters`);
        }
        if (field.validation?.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(strValue)) {
            fieldErrors.push('Please enter a valid format');
          }
        }
      }
    }

    return fieldErrors;
  };

  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Clear error for this field
    setErrors(prev => ({
      ...prev,
      [fieldId]: []
    }));
  };

  const handleCheckboxChange = (fieldId, option, checked) => {
    setFormData(prev => {
      const currentValues = prev[fieldId] || [];
      if (checked) {
        return {
          ...prev,
          [fieldId]: [...currentValues, option]
        };
      } else {
        return {
          ...prev,
          [fieldId]: currentValues.filter(v => v !== option)
        };
      }
    });
  };

  const handleFileUpload = async (fieldId, file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fieldId', fieldId);
      formData.append('roundId', round.roundId);

      const apiBaseUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' 
        ? `${window.location.origin.replace(/\/$/, '')}/api`
        : 'http://localhost:5000/api');

      const response = await fetch(`${apiBaseUrl}/interviews/upload-form-file`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setUploadedFiles(prev => ({
          ...prev,
          [fieldId]: result.filePath
        }));
        handleFieldChange(fieldId, result.filePath);
      } else {
        throw new Error('File upload failed');
      }
    } catch (error) {
      console.error('File upload error:', error);
      setErrors(prev => ({
        ...prev,
        [fieldId]: ['File upload failed. Please try again.']
      }));
    }
  };

  const validateCurrentStep = () => {
    const stepErrors = {};
    let hasErrors = false;

    currentFields.forEach(field => {
      const fieldErrors = validateField(field, formData[field.id]);
      if (fieldErrors.length > 0) {
        stepErrors[field.id] = fieldErrors;
        hasErrors = true;
      }
    });

    setErrors(prev => ({ ...prev, ...stepErrors }));
    return !hasErrors;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    // Validate all fields
    const allErrors = {};
    let hasErrors = false;

    round.formFields?.forEach(field => {
      const fieldErrors = validateField(field, formData[field.id]);
      if (fieldErrors.length > 0) {
        allErrors[field.id] = fieldErrors;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(allErrors);
      setCurrentStep(0); // Go to first step with errors
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('FormSubmissionRound: candidateInfo:', candidateInfo);
      console.log('FormSubmissionRound: round:', round);
      console.log('FormSubmissionRound: formData:', formData);
      
      const submissionData = {
        candidateId: candidateInfo?.id || 'anonymous',
        candidateName: candidateInfo?.name || 'Anonymous User',
        candidateEmail: candidateInfo?.email || 'anonymous@example.com',
        roundId: round.roundId,
        responses: round.formFields.map(field => ({
          fieldId: field.id,
          fieldType: field.type,
          value: formData[field.id],
          submittedAt: new Date().toISOString()
        })),
        submittedAt: new Date().toISOString(),
        isComplete: true
      };

      console.log('FormSubmissionRound: Sending submission data:', submissionData);

      const apiBaseUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' 
        ? `${window.location.origin.replace(/\/$/, '')}/api`
        : 'http://localhost:5000/api');

      const response = await fetch(`${apiBaseUrl}/interviews/submit-form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });

      console.log('FormSubmissionRound: Response status:', response.status);
      console.log('FormSubmissionRound: Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('FormSubmissionRound: Success response:', result);
        setSubmitSuccess(true);
        setTimeout(() => {
          onComplete(submissionData);
        }, 2000);
      } else {
        const errorData = await response.json();
        console.error('FormSubmissionRound: Error response:', errorData);
        // If backend reports already submitted, treat as completed and advance
        const alreadySubmitted =
          response.status === 400 &&
          typeof errorData?.error === 'string' &&
          /already submitted/i.test(errorData.error);

        if (alreadySubmitted) {
          console.log('FormSubmissionRound: Detected already-submitted round; advancing.');
          setSubmitSuccess(true);
          setTimeout(() => {
            onComplete({ ...submissionData, alreadySubmitted: true });
          }, 800);
          return;
        }

        throw new Error(errorData.error || 'Form submission failed');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setErrors({ submit: ['Form submission failed. Please try again.'] });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field) => {
    const fieldValue = formData[field.id] || '';
    const fieldErrors = errors[field.id] || [];

    const getFieldIcon = (type) => {
      const icons = {
        text: Type,
        textarea: FileText,
        email: Mail,
        number: Hash,
        date: Calendar,
        select: List,
        radio: Radio,
        checkbox: CheckSquare,
        file: Upload
      };
      const IconComponent = icons[type] || Type;
      return <IconComponent className="w-4 h-4" />;
    };

    return (
      <motion.div
        key={field.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-lg border ${
          fieldErrors.length > 0 
            ? 'border-red-300 bg-red-50' 
            : isDarkMode 
              ? 'border-gray-600 bg-gray-700/50' 
              : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          {getFieldIcon(field.type)}
          <label className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>

        {field.type === 'text' && (
          <input
            type="text"
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 rounded-lg border ${
              fieldErrors.length > 0
                ? 'border-red-300 focus:border-red-500'
                : isDarkMode
                  ? 'border-gray-600 bg-gray-700 text-white focus:border-blue-500'
                  : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'
            }`}
          />
        )}

        {field.type === 'textarea' && (
          <textarea
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={`w-full px-3 py-2 rounded-lg border ${
              fieldErrors.length > 0
                ? 'border-red-300 focus:border-red-500'
                : isDarkMode
                  ? 'border-gray-600 bg-gray-700 text-white focus:border-blue-500'
                  : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'
            }`}
          />
        )}

        {field.type === 'email' && (
          <input
            type="email"
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 rounded-lg border ${
              fieldErrors.length > 0
                ? 'border-red-300 focus:border-red-500'
                : isDarkMode
                  ? 'border-gray-600 bg-gray-700 text-white focus:border-blue-500'
                  : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'
            }`}
          />
        )}

        {field.type === 'number' && (
          <input
            type="number"
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            className={`w-full px-3 py-2 rounded-lg border ${
              fieldErrors.length > 0
                ? 'border-red-300 focus:border-red-500'
                : isDarkMode
                  ? 'border-gray-600 bg-gray-700 text-white focus:border-blue-500'
                  : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'
            }`}
          />
        )}

        {field.type === 'date' && (
          <input
            type="date"
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              fieldErrors.length > 0
                ? 'border-red-300 focus:border-red-500'
                : isDarkMode
                  ? 'border-gray-600 bg-gray-700 text-white focus:border-blue-500'
                  : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'
            }`}
          />
        )}

        {field.type === 'select' && (
          <select
            value={fieldValue}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border ${
              fieldErrors.length > 0
                ? 'border-red-300 focus:border-red-500'
                : isDarkMode
                  ? 'border-gray-600 bg-gray-700 text-white focus:border-blue-500'
                  : 'border-gray-300 bg-white text-gray-900 focus:border-blue-500'
            }`}
          >
            <option value="">Select an option...</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        )}

        {field.type === 'radio' && (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={fieldValue === option}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className="text-blue-600"
                />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{option}</span>
              </label>
            ))}
          </div>
        )}

        {field.type === 'checkbox' && (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fieldValue.includes(option)}
                  onChange={(e) => handleCheckboxChange(field.id, option, e.target.checked)}
                  className="text-blue-600"
                />
                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>{option}</span>
              </label>
            ))}
          </div>
        )}

        {field.type === 'file' && (
          <div className="space-y-2">
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleFileUpload(field.id, file);
                }
              }}
              className={`w-full px-3 py-2 rounded-lg border ${
                isDarkMode
                  ? 'border-gray-600 bg-gray-700 text-white'
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            />
            {uploadedFiles[field.id] && (
              <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                ✓ File uploaded successfully
              </p>
            )}
          </div>
        )}

        {fieldErrors.length > 0 && (
          <div className="mt-2 space-y-1">
            {fieldErrors.map((error, index) => (
              <p key={index} className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {error}
              </p>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  if (submitSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`min-h-screen flex items-center justify-center p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
      >
        <div className={`max-w-md w-full p-8 rounded-2xl shadow-xl text-center ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="w-8 h-8 text-green-600" />
          </motion.div>
          <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Form Submitted Successfully!
          </h2>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Thank you for completing the form. Your responses have been recorded.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 p-6 rounded-2xl shadow-xl ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-full">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {round.title}
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Form Submission Round
              </p>
            </div>
          </div>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {round.description}
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`mb-8 p-4 rounded-lg ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Step {currentStep + 1} of {totalSteps}
            </span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {Math.round(((currentStep + 1) / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className={`w-full bg-gray-200 rounded-full h-2 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
              className="bg-blue-600 h-2 rounded-full"
            />
          </div>
        </motion.div>

        {/* Form Fields */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6 mb-8"
        >
          {currentFields.map(renderField)}
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-between items-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              currentStep === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </motion.button>

          {currentStep === totalSteps - 1 ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Submit Form
                </>
              )}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}
        </motion.div>

        {/* Submit Error */}
        {errors.submit && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{errors.submit[0]}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FormSubmissionRound;
