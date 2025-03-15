const mongoose = require('mongoose');

// Test user data
const testUsers = [
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin',
    isActive: true
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Regular User',
    email: 'user@example.com',
    password: 'password456',
    role: 'user',
    isActive: true
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Inactive User',
    email: 'inactive@example.com',
    password: 'password789',
    role: 'user',
    isActive: false
  }
];

// Function to create test users in the database
const setupTestUsers = async (User) => {
  // Clear users collection
  await User.deleteMany({});
  
  // Create users
  const users = await User.create(testUsers);
  
  return users;
};

module.exports = {
  testUsers,
  setupTestUsers
}; 