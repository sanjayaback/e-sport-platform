const bcrypt = require('bcryptjs');

async function createSuperUser() {
  const superUser = {
    username: 'admin',
    email: 'admin@gmail.com',
    password: 'admin123456',
    role: 'admin'
  };

  const hashedPassword = await bcrypt.hash(superUser.password, 12);
  
  console.log('Super User Credentials:');
  console.log('Username:', superUser.username);
  console.log('Email:', superUser.email);
  console.log('Password:', superUser.password);
  console.log('Role:', superUser.role);
  console.log('Hashed Password:', hashedPassword);
  
  console.log('\nYou can now:');
  console.log('1. Use these credentials to register via the API');
  console.log('2. Or manually add this user to your Google Sheets Users table');
  console.log('3. Login at http://localhost:3000/auth/login');
}

createSuperUser().catch(console.error);
