import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap,
  Save,
  Plus,
  X
} from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    profile: {
      phone: user?.profile?.phone || '',
      location: user?.profile?.location || '',
      bio: user?.profile?.bio || '',
      skills: user?.profile?.skills || [],
      experience: user?.profile?.experience || '',
      education: user?.profile?.education || '',
      resume: user?.profile?.resume || ''
    }
  });

  const updateProfileMutation = useMutation(
    async (data) => {
      const response = await axios.put('/api/users/profile', data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        updateUser(data.user);
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update profile');
      }
    }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('profile.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSkillChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        skills: prev.profile.skills.map((skill, i) => i === index ? value : skill)
      }
    }));
  };

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        skills: [...prev.profile.skills, '']
      }
    }));
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        skills: prev.profile.skills.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      profile: {
        phone: user?.profile?.phone || '',
        location: user?.profile?.location || '',
        bio: user?.profile?.bio || '',
        skills: user?.profile?.skills || [],
        experience: user?.profile?.experience || '',
        education: user?.profile?.education || '',
        resume: user?.profile?.resume || ''
      }
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
            <p className="text-gray-600">
              Manage your personal information and professional details.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="btn btn-outline"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      className="form-input pl-10"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      className="form-input pl-10 bg-gray-100"
                      value={user?.email || ''}
                      disabled
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="form-label">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      name="profile.phone"
                      className="form-input pl-10"
                      placeholder="+1 (555) 123-4567"
                      value={formData.profile.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="profile.location"
                      className="form-input pl-10"
                      placeholder="City, State, Country"
                      value={formData.profile.location}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="form-label">Bio</label>
                <textarea
                  name="profile.bio"
                  className="form-textarea"
                  rows="4"
                  placeholder="Tell us about yourself, your experience, and what you're looking for..."
                  value={formData.profile.bio}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Professional Information */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Professional Information</h2>

              <div className="space-y-6">
                <div>
                  <label className="form-label">Experience</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <textarea
                      name="profile.experience"
                      className="form-textarea pl-10"
                      rows="3"
                      placeholder="Describe your work experience, achievements, and career highlights..."
                      value={formData.profile.experience}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Education</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <textarea
                      name="profile.education"
                      className="form-textarea pl-10"
                      rows="3"
                      placeholder="List your educational background, degrees, certifications, and relevant coursework..."
                      value={formData.profile.education}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Skills</label>
                  <div className="space-y-2">
                    {formData.profile.skills.map((skill, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          className="form-input flex-1"
                          placeholder="e.g., JavaScript, React, Node.js"
                          value={skill}
                          onChange={(e) => handleSkillChange(index, e.target.value)}
                          disabled={!isEditing}
                        />
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => removeSkill(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={addSkill}
                        className="flex items-center text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Skill
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="form-label">Resume URL</label>
                  <input
                    type="url"
                    name="profile.resume"
                    className="form-input"
                    placeholder="https://example.com/your-resume.pdf"
                    value={formData.profile.resume}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Information</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="form-label">Role</label>
                  <input
                    type="text"
                    className="form-input bg-gray-100"
                    value={user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || ''}
                    disabled
                  />
                </div>
                <div>
                  <label className="form-label">Member Since</label>
                  <input
                    type="text"
                    className="form-input bg-gray-100"
                    value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProfileMutation.isLoading}
                  className="btn btn-primary"
                >
                  {updateProfileMutation.isLoading ? (
                    <>
                      <div className="spinner mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
