import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function createAdminUser() {
    try {
        const uri = process.env.MONGODB_URI;
        console.log('Connecting to MongoDB...');
        
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 60000,
            socketTimeoutMS: 45000,
            maxPoolSize: 50,
            minPoolSize: 0,
            family: 4
        });
        
        console.log('Connected to MongoDB');

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Create admin user
        const adminUser = {
            email: 'newaadmin@newaadmin.com',
            password: hashedPassword,
            name: 'Admin User',
            role: 'admin',
            registered: true,
            credits: 123654, // This sets unlimited credits
            subscription: {
                plan: 'unlimited',
                status: 'active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
            }
        };

        // Insert the admin user
        const result = await mongoose.connection.db.collection('users').insertOne(adminUser);
        
        if (result.insertedId) {
            console.log('Admin user created successfully');
            console.log('You can now log in with:');
            console.log('Email: newaadmin@newaadmin.com');
            console.log('Password: admin123');
        }

        await mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error creating admin user:', error);
        if (error.code === 11000) {
            console.log('User already exists. Try logging in with the provided credentials.');
        }
    }
}

createAdminUser();
