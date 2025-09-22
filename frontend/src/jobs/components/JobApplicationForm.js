import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Send, Upload, FileText, User, Mail, Phone, X } from 'lucide-react';

const JobApplicationForm = ({ jobId, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    coverLetter: '',
    resume: '',
    portfolio: '',
    linkedin: '',
    phone: '',
    expectedSalary: '',
    availability: '',
    additionalInfo: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const applyMutation = useMutation(
    async (data) => {
      const response = await axios.post('/api/applications', {
        jobId,
        ...data
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Application submitted successfully!');
        queryClient.invalidateQueries(['job', jobId]);
        queryClient.invalidateQueries('user-applications');
        onSuccess();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to submit application');
      },
      onSettled: () => {
        setIsSubmitting(false);
      }
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Clean up empty fields
    const cleanedData = Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => value.trim() !== '')
    );

    applyMutation.mutate(cleanedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Apply for this Job</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Contact Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      className="form-input pl-10"
                      placeholder="+1 (555) 123-4567"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">LinkedIn Profile</label>
                  <input
                    type="url"
                    name="linkedin"
                    className="form-input"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={formData.linkedin}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Application Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Application Details
              </h3>

              <div>
                <label className="form-label">Cover Letter *</label>
                <textarea
                  name="coverLetter"
                  className="form-textarea"
                  rows="6"
                  placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                  value={formData.coverLetter}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="form-label">Resume/CV URL *</label>
                <div className="relative">
                  <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    name="resume"
                    className="form-input pl-10"
                    placeholder="https://example.com/your-resume.pdf"
                    value={formData.resume}
                    onChange={handleChange}
                    required
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Upload your resume to Google Drive, Dropbox, or similar and share the link
                </p>
              </div>

              <div>
                <label className="form-label">Portfolio/Work Samples</label>
                <input
                  type="url"
                  name="portfolio"
                  className="form-input"
                  placeholder="https://yourportfolio.com or GitHub profile"
                  value={formData.portfolio}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Expected Salary</label>
                  <input
                    type="text"
                    name="expectedSalary"
                    className="form-input"
                    placeholder="e.g., $80,000 - $100,000"
                    value={formData.expectedSalary}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="form-label">Availability</label>
                  <select
                    name="availability"
                    className="form-select"
                    value={formData.availability}
                    onChange={handleChange}
                  >
                    <option value="">Select availability</option>
                    <option value="immediate">Immediate</option>
                    <option value="2weeks">2 weeks notice</option>
                    <option value="1month">1 month notice</option>
                    <option value="2months">2+ months notice</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Additional Information</label>
                <textarea
                  name="additionalInfo"
                  className="form-textarea"
                  rows="3"
                  placeholder="Any additional information you'd like to share..."
                  value={formData.additionalInfo}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-secondary"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Send className="h-5 w-5" />
                <span>{isSubmitting ? 'Submitting...' : 'Submit Application'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JobApplicationForm;
