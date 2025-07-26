// Simple test script to check if notifications are working
// Run this with: node test-notification.js

const testNotification = async () => {
    try {
        // Test the debug endpoint
        const debugResponse = await fetch('http://localhost:3000/api/notifications/debug');
        const debugData = await debugResponse.json();
        console.log('Debug info:', debugData);

        // Test a like action (you'll need to replace these IDs with real ones)
        // const likeResponse = await fetch('http://localhost:3000/api/posts/some-post-id/like', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         // Add authentication headers here
        //     }
        // });
        // console.log('Like response:', await likeResponse.json());

    } catch (error) {
        console.error('Test failed:', error);
    }
};

testNotification();