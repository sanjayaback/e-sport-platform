const bcrypt = require('bcryptjs');

async function registerSuperUser() {
  try {
    // First register the user via API
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'Admin',
        email: 'admin@gmail.com',
        password: 'admin123456',
        role: 'admin'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Super user registered successfully!');
      console.log('Login credentials:');
      console.log('Email: admin@esports-platform.com');
      console.log('Password: admin123456');
      console.log('Role: admin');
      console.log('\nYou can now login at http://localhost:3000/auth/login');
    } else {
      console.log('❌ Registration failed:', result.error || result.message);
      
      if (result.error?.includes('already registered')) {
        console.log('\nUser already exists. Try logging in with:');
        console.log('Email: admin@esports-platform.com');
        console.log('Password: admin123456');
      }
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('\nMake sure the development server is running: npm run dev');
  }
}

registerSuperUser();
