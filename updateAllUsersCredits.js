import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function updateAllUsersCredits() {
    let sourceDb, targetDb;
    try {
        // Connect to source database (original)
        const sourceUri = process.env.MONGODB_URI.replace('/tshirt', '');
        const sourceConnection = await mongoose.createConnection(sourceUri);
        sourceDb = sourceConnection;
        console.log('Connected to source database');

        // Connect to target database (tshirt)
        const targetUri = process.env.MONGODB_URI;
        const targetConnection = await mongoose.createConnection(targetUri);
        targetDb = targetConnection;
        console.log('Connected to target database');

        // Get all users from source database
        const sourceUsers = await sourceDb.collection('users').find({}).toArray();
        console.log(`Found ${sourceUsers.length} users in source database`);

        // Update each user in target database
        let updatedCount = 0;
        for (const user of sourceUsers) {
            const result = await targetDb.collection('users').updateOne(
                { email: user.email },
                {
                    $set: {
                        credits: user.credits,
                        subscription: user.subscription,
                        creditHistory: user.creditHistory
                    }
                }
            );
            if (result.modifiedCount > 0) updatedCount++;
        }

        console.log(`Updated credits for ${updatedCount} users`);

        // Verify some updates
        const sampleUsers = await targetDb.collection('users').find({}).limit(5).toArray();
        console.log('\nSample of updated users:');
        sampleUsers.forEach(user => {
            console.log(`${user.email}: ${user.credits === 123654 ? 'Unlimited' : user.credits} credits`);
        });

    } catch (error) {
        console.error('Error updating users:', error);
    } finally {
        if (sourceDb) await sourceDb.close();
        if (targetDb) await targetDb.close();
        console.log('\nDatabase connections closed');
    }
}

updateAllUsersCredits();
