import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(uri, {
            dbName: 'tshirt',
            serverSelectionTimeoutMS: 30000, // Reduced from 60000
            socketTimeoutMS: 30000, // Reduced from 45000
            connectTimeoutMS: 30000, // Added explicit connect timeout
            bufferCommands: false, // Disable mongoose buffering
            maxPoolSize: 10, // Reduced from 50
            minPoolSize: 0,
            family: 4
        });

        console.log('Connected to MongoDB successfully');

        // Test the connection
        const adminDb = mongoose.connection.db.admin();
        await adminDb.ping();
        console.log('MongoDB ping successful');

        return true;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error; // Don't exit, let the caller handle it
    }
};

mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('Mongoose connection closed through app termination');
        process.exit(0);
    } catch (error) {
        console.error('Error closing mongoose connection:', error);
        process.exit(1);
    }
});

// Connect to MongoDB
connectDB();

export default connectDB;
