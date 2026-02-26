const bcrypt = require('bcryptjs');

async function generateHashes() {
    console.log('Generating password hashes...\n');

    const adminHash = await bcrypt.hash('admin123', 10);
    const staffHash = await bcrypt.hash('staff123', 10);

    console.log('='.repeat(60));
    console.log('ADMIN USER');
    console.log('='.repeat(60));
    console.log('Email: admin@loan.com');
    console.log('Password: admin123');
    console.log('Hash:', adminHash);
    console.log('\n');

    console.log('='.repeat(60));
    console.log('STAFF USER');
    console.log('='.repeat(60));
    console.log('Email: staff@loan.com');
    console.log('Password: staff123');
    console.log('Hash:', staffHash);
    console.log('\n');

    console.log('='.repeat(60));
    console.log('MONGODB INSERT COMMAND');
    console.log('='.repeat(60));
    console.log(`
use loanmanagement

db.users.insertMany([
  {
    name: "Ankit Patidar",
    email: "admin@loan.com",
    password: "${adminHash}",
    role: "admin",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Rahul Sharma",
    email: "staff@loan.com",
    password: "${staffHash}",
    role: "staff",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
])
  `);
}

generateHashes().catch(console.error);
