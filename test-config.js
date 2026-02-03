/**
 * WebSocket URL Configuration Test
 * Run this to verify your WebSocket URL is configured correctly
 */

import { WEBSOCKET_URL, API_BASE_URL } from './src/config/api.js';

console.log('='.repeat(60));
console.log('📋 CloudMeetX Configuration Check');
console.log('='.repeat(60));
console.log('');
console.log('REST API URL:', API_BASE_URL);
console.log('WebSocket URL:', WEBSOCKET_URL);
console.log('');

// Check if URLs are valid
if (!WEBSOCKET_URL || WEBSOCKET_URL === 'undefined') {
    console.error('❌ ERROR: WebSocket URL is not configured!');
    console.log('');
    console.log('💡 Fix: Create or update .env file with:');
    console.log('   VITE_WEBSOCKET_URL=wss://YOUR-API-ID.execute-api.REGION.amazonaws.com/$default');
    console.log('');
} else if (!WEBSOCKET_URL.startsWith('wss://')) {
    console.error('❌ ERROR: WebSocket URL must start with wss://');
    console.log('   Current value:', WEBSOCKET_URL);
    console.log('');
} else {
    console.log('✅ Configuration looks good!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify the stage name in your WebSocket URL matches API Gateway');
    console.log('2. Common stages: $default, production, prod, dev');
    console.log('3. Restart dev server: npm run dev');
    console.log('');
}

console.log('='.repeat(60));
