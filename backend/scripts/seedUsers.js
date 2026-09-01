const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-hiring';

const demoUsers = [
  // Candidate Demo
  {
    name: 'John Candidate',
    email: 'candidate@demo.com',
    password: 'password123',
    role: 'candidate',
    profile: {
      phone: '+1-555-0123',
      location: 'San Francisco, CA',
      bio: 'Experienced software developer with 5+ years in full-stack development',
      skills: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB'],
      experience: '5 years',
      education: 'BS Computer Science, Stanford University',
      linkedin: 'https://linkedin.com/in/johncandidate',
      github: 'https://github.com/johncandidate'
    },
    candidateProfile: {
      expectedSalary: '$80,000 - $120,000',
      availability: 'Immediately',
      workPreference: 'hybrid',
      jobPreferences: ['Software Engineer', 'Full Stack Developer', 'Frontend Developer'],
      languages: ['English', 'Spanish'],
      certifications: ['AWS Certified Developer', 'Google Cloud Professional']
    }
  },
  // Recruiter Demo
  {
    name: 'Sarah Recruiter',
    email: 'recruiter@demo.com',
    password: 'password123',
    role: 'recruiter',
    profile: {
      phone: '+1-555-0456',
      location: 'New York, NY',
      bio: 'Senior Talent Acquisition Specialist with expertise in tech recruitment',
      skills: ['Talent Acquisition', 'Technical Recruitment', 'Interviewing', 'Candidate Assessment'],
      experience: '8 years',
      education: 'MS Human Resources, Columbia University',
      linkedin: 'https://linkedin.com/in/sarahrecruiter'
    },
    recruiterProfile: {
      company: 'TechCorp Solutions',
      companySize: '501-1000',
      industry: 'Technology',
      position: 'Senior Talent Acquisition Manager',
      department: 'Human Resources',
      hiringBudget: '$150,000 - $200,000',
      preferredLocations: ['New York', 'San Francisco', 'Remote']
    }
  },
  // Admin Demo
  {
    name: 'Admin User',
    email: 'admin@demo.com',
    password: 'password123',
    role: 'admin',
    profile: {
      phone: '+1-555-0789',
      location: 'Seattle, WA',
      bio: 'System Administrator for AI Hiring Platform',
      skills: ['System Administration', 'Database Management', 'User Management', 'Security'],
      experience: '10 years',
      education: 'MS Information Systems, University of Washington'
    },
    adminProfile: {
      permissions: ['user_management', 'job_management', 'application_management', 'analytics'],
      loginCount: 0
    }
  }
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create demo users
    for (const userData of demoUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`Created ${user.role} user: ${user.email}`);
    }

    console.log('Demo users created successfully!');
    console.log('\nDemo Accounts:');
    console.log('Candidate: candidate@demo.com / password123');
    console.log('Recruiter: recruiter@demo.com / password123');
    console.log('Admin: admin@demo.com / password123');

  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seed function
seedUsers();
