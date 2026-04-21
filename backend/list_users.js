const mongoose = require('mongoose');
const User = require('./models/User');

async function listUsers() {
  await mongoose.connect('mongodb://localhost:27017/desktop_pooling');
  const users = await User.find({}, { name: 1, email: 1, role: 1, library_id: 1, student_id: 1 });
  console.log(JSON.stringify(users, null, 2));
  await mongoose.disconnect();
}

listUsers().catch(err => {
  console.error(err);
  process.exit(1);
});
