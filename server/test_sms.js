import { sendSMSNotification } from './src/utils/notificationUtils.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

(async () => {
    try {
        const result = await sendSMSNotification('+919641367824', { message: 'Test SMS to user 9641367824' });
        console.log('Result:', result);
    } catch (error) {
        console.error('Error while sending test SMS:', error);
    }
})();
