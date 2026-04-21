const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Library = require('./models/Library');

async function createTestUsers() {
  await mongoose.connect('mongodb://localhost:27017/desktop_pooling');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Find or create a library
  let library = await Library.findOne();
  if (!library) {
    library = new Library({ name: 'Test Library', location: 'Test Location' });
    await library.save();
  }

  // Create test student
  await User.findOneAndUpdate(
    { email: 'test_student@example.com' },
    { 
      student_id: 'TEST-ST-001',
      name: 'Test Student',
      email: 'test_student@example.com',
      password: hashedPassword,
      role: 'student',
      library_id: null
    },
    { upsert: true }
  );

  // Create test librarian
  await User.findOneAndUpdate(
    { email: 'test_librarian@example.com' },
    { 
      student_id: 'TEST-LIB-001',
      name: 'Test Librarian',
      email: 'test_librarian@example.com',
      password: hashedPassword,
      role: 'librarian',
      library_id: library._id
    },
    { upsert: true }
  );

  console.log('Test users created successfully');
  console.log('Library ID:', library._id);
  await mongoose.disconnect();
}

createTestUsers().catch(err => {
  console.error(err);
  process.exit(1);
});
