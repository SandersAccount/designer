import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function updateAdminCredits() {
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

        // Update admin user with unlimited credits and additional credit history
        const result = await mongoose.connection.db.collection('users').updateOne(
            { email: 'newaadmin@newaadmin.com' },
            {
                $set: {
                    credits: 123654, // This is the code for unlimited credits
                    subscription: {
                        plan: 'unlimited',
                        status: 'active',
                        startDate: new Date(),
                        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
                    }
                },
                $push: {
                    creditHistory: {
                        product: 'AdminUnlimited',
                        purchasedAt: new Date()
                    }
                }
            }
        );

        if (result.modifiedCount > 0) {
            console.log('Admin user updated successfully');
            
            // Verify the current state
            const admin = await mongoose.connection.db.collection('users').findOne(
                { email: 'newaadmin@newaadmin.com' }
            );
            
            console.log('\nCurrent admin status:');
            console.log('Credits:', admin.credits === 123654 ? 'Unlimited' : admin.credits);
            console.log('Subscription Plan:', admin.subscription.plan);
            console.log('Subscription Status:', admin.subscription.status);
            console.log('Credit History Items:', admin.creditHistory ? admin.creditHistory.length : 0);
        } else {
            console.log('No changes were needed - admin already has unlimited credits');
        }

        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    } catch (error) {
        console.error('Error updating admin credits:', error);
    }
}

updateAdminCredits();
