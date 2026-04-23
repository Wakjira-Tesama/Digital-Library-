const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// This script ensures the admin accounts from the project are active in the local 'sdpms' database.
async function seedAdmins() {
  const uri = 'mongodb://localhost:27017/sdpms';
  const admins = [
    {
      student_id: 'admin_applied',
      name: 'Applied Library Admin',
      email: 'applied_admin@astu.edu.et',
      password: 'admin_applied_pass',
      is_admin: true,
      library: 'applied',
      is_verified: true
    },
    {
      student_id: 'admin_central',
      name: 'Central Library Admin',
      email: 'central_admin@astu.edu.et',
      password: 'admin_central_pass',
      is_admin: true,
      library: 'central',
      is_verified: true
    },
    {
      student_id: 'ADMIN-001',
      name: 'Global Admin',
      email: 'admin@astu.edu.et',
      password: 'adminpassword',
      is_admin: true,
      role: 'general_admin',
      is_verified: true
    }
  ];

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected successfully.');

    const adminCollection = mongoose.connection.collection('students');

    for (const adminData of admins) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);
      
      const { password, ...updateData } = adminData;
      
      await adminCollection.findOneAndUpdate(
        { email: adminData.email },
        { $set: { ...updateData, password: hashedPassword } },
        { upsert: true, returnDocument: 'after' }
      );
      console.log(`Admin ${adminData.email} seeded/updated.`);
    }

    console.log('All admins seeded.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seedAdmins();
