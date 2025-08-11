import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
    try {
        const uri = process.env.MONGODB_URI;
        console.log('Attempting to connect to MongoDB...');
        
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 60000,
            socketTimeoutMS: 45000,
            maxPoolSize: 50,
            minPoolSize: 0,
            family: 4
        });
        
        console.log('Connected successfully to MongoDB');
        
        // Try to find the specific user
        const user = await mongoose.connection.db.collection('users').findOne({ 
            email: 'newaadmin@newaadmin.com' 
        });
        
        if (user) {
            console.log('User details:', {
                email: user.email,
                name: user.name,
                registered: user.registered,
                hasPassword: !!user.password,
                role: user.role,
                credits: user.credits
            });

            // Update user to ensure it's registered
            const result = await mongoose.connection.db.collection('users').updateOne(
                { email: 'newaadmin@newaadmin.com' },
                { $set: { registered: true } }
            );
            console.log('Updated user registration:', result.modifiedCount > 0 ? 'Yes' : 'No changes needed');
        } else {
            console.log('User not found');
        }
        
        await mongoose.connection.close();
        console.log('Connection closed');
    } catch (error) {
        console.error('Database connection error:', error);
    }
}

testConnection();
