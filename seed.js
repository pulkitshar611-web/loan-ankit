require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected Successfully');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

// User Schema (inline for seeding)
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Seed function
const seedUsers = async () => {
    try {
        await connectDB();

        // Clear existing users
        await User.deleteMany({});
        console.log('🗑️  Cleared existing users');

        // Hash passwords
        const adminPassword = await bcrypt.hash('admin123', 10);
        const staffPassword = await bcrypt.hash('staff123', 10);

        // Create users
        const users = [
            {
                name: 'Ankit Patidar',
                email: 'admin@loan.com',
                password: adminPassword,
                role: 'admin',
                isActive: true
            },
            {
                name: 'Rahul Sharma',
                email: 'staff@loan.com',
                password: staffPassword,
                role: 'staff',
                isActive: true
            }
        ];

        await User.insertMany(users);
        console.log('✅ Sample users created successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('━'.repeat(50));
        console.log('👤 Admin:');
        console.log('   Email: admin@loan.com');
        console.log('   Password: admin123');
        console.log('\n👤 Staff:');
        console.log('   Email: staff@loan.com');
        console.log('   Password: staff123');
        console.log('━'.repeat(50));
        console.log('\n✅ Database seeded! You can now login.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error.message);
        process.exit(1);
    }
};

seedUsers();
