const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-hiring';

async function seedAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Ensure only one admin exists
    const admins = await User.find({ role: 'admin' });
    if (admins.length > 1) {
      console.log('⚠️  Multiple admins found. Keeping the first, downgrading others to recruiter.');
      const [keep, ...others] = admins;
      for (const other of others) {
        other.role = 'recruiter';
        other.isApproved = false;
        other.approvalStatus = 'pending';
        await other.save();
      }
    }

    // Check if target admin exists
    const existingGmailAdmin = await User.findOne({ email: 'admin@gmail.com' });
    if (existingGmailAdmin) {
      console.log('✅ Admin user exists:', existingGmailAdmin.email);
      return;
    }

    // Check if any admin exists and update email if needed
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin && existingAdmin.email !== 'admin@gmail.com') {
      console.log('🔄 Updating existing admin email from', existingAdmin.email, 'to admin@gmail.com');
      existingAdmin.email = 'admin@gmail.com';
      await existingAdmin.save();
      console.log('✅ Admin email updated successfully!');
      console.log('📧 Email: admin@gmail.com');
      console.log('🔑 Password: admin123');
      return;
    }

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@gmail.com',
      password: 'admin123', // This will be hashed automatically
      role: 'admin',
      isActive: true,
      isApproved: true,
      approvalStatus: 'approved',
      adminProfile: {
        permissions: ['all'],
        loginCount: 0
      }
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seed function
seedAdmin();
