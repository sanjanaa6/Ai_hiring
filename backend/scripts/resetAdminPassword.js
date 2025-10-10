const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-hiring';

async function resetAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Find the admin user
    const adminUser = await User.findOne({ email: 'admin@gmail.com', role: 'admin' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found with email: admin@gmail.com');
      return;
    }

    console.log('👤 Found admin user:', adminUser.email);
    
    // Reset password to 'admin123'
    adminUser.password = 'admin123';
    await adminUser.save(); // This will trigger the pre-save hook to hash the password
    
    console.log('✅ Admin password reset successfully!');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after login!');

  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the reset function
resetAdminPassword();
