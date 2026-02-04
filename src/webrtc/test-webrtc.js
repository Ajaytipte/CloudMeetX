/**
 * WebRTC Test Configuration
 * Use this to verify your WebRTC setup is working correctly
 */

// Test WebSocket connection
export const testWebSocketConnection = async () => {
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL;

    console.log('🧪 Testing WebSocket connection...');
    console.log('URL:', wsUrl);

    return new Promise((resolve, reject) => {
        const ws = new WebSocket(wsUrl + '?meetingId=test&userId=test-user');

        ws.onopen = () => {
            console.log('✅ WebSocket connected successfully!');
            ws.close();
            resolve(true);
        };

        ws.onerror = (error) => {
            console.error('❌ WebSocket connection failed:', error);
            reject(error);
        };

        ws.onclose = () => {
            console.log('🔌 WebSocket closed');
        };

        // Timeout after 5 seconds
        setTimeout(() => {
            if (ws.readyState !== WebSocket.OPEN) {
                ws.close();
                reject(new Error('Connection timeout'));
            }
        }, 5000);
    });
};

// Test getUserMedia (camera/microphone access)
export const testGetUserMedia = async () => {
    console.log('🧪 Testing camera/microphone access...');

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        console.log('✅ Media access granted!');
        console.log('Video tracks:', stream.getVideoTracks().length);
        console.log('Audio tracks:', stream.getAudioTracks().length);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        return true;
    } catch (error) {
        console.error('❌ Media access failed:', error);
        throw error;
    }
};

// Test RTCPeerConnection creation
export const testPeerConnection = async () => {
    console.log('🧪 Testing RTCPeerConnection...');

    try {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        });

        console.log('✅ RTCPeerConnection created successfully!');
        console.log('Connection state:', pc.connectionState);
        console.log('Signaling state:', pc.signalingState);

        pc.close();
        return true;
    } catch (error) {
        console.error('❌ RTCPeerConnection failed:', error);
        throw error;
    }
};

// Test complete WebRTC support
export const testWebRTCSupport = () => {
    console.log('🧪 Testing WebRTC browser support...');

    const support = {
        getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        RTCPeerConnection: !!window.RTCPeerConnection,
        WebSocket: !!window.WebSocket,
        supported: false
    };

    support.supported = support.getUserMedia && support.RTCPeerConnection && support.WebSocket;

    console.log('📊 WebRTC Support:');
    console.log('  getUserMedia:', support.getUserMedia ? '✅' : '❌');
    console.log('  RTCPeerConnection:', support.RTCPeerConnection ? '✅' : '❌');
    console.log('  WebSocket:', support.WebSocket ? '✅' : '❌');
    console.log('  Overall:', support.supported ? '✅ SUPPORTED' : '❌ NOT SUPPORTED');

    return support;
};

// Run all tests
export const runAllTests = async () => {
    console.log('\n🚀 Running WebRTC Tests...\n');

    const results = {
        support: false,
        webSocket: false,
        media: false,
        peerConnection: false
    };

    try {
        // Test 1: Browser Support
        console.log('───────────────────────────────────');
        const support = testWebRTCSupport();
        results.support = support.supported;

        if (!support.supported) {
            console.log('\n❌ WebRTC is not supported in this browser!');
            return results;
        }

        // Test 2: WebSocket Connection
        console.log('\n───────────────────────────────────');
        try {
            await testWebSocketConnection();
            results.webSocket = true;
        } catch (error) {
            console.error('WebSocket test failed:', error.message);
        }

        // Test 3: Media Access
        console.log('\n───────────────────────────────────');
        try {
            await testGetUserMedia();
            results.media = true;
        } catch (error) {
            console.error('Media access test failed:', error.message);
        }

        // Test 4: Peer Connection
        console.log('\n───────────────────────────────────');
        try {
            await testPeerConnection();
            results.peerConnection = true;
        } catch (error) {
            console.error('Peer connection test failed:', error.message);
        }

        // Summary
        console.log('\n═══════════════════════════════════');
        console.log('📊 TEST SUMMARY');
        console.log('═══════════════════════════════════');
        console.log('Browser Support:', results.support ? '✅' : '❌');
        console.log('WebSocket:', results.webSocket ? '✅' : '❌');
        console.log('Media Access:', results.media ? '✅' : '❌');
        console.log('Peer Connection:', results.peerConnection ? '✅' : '❌');

        const allPassed = Object.values(results).every(v => v === true);
        console.log('\n' + (allPassed ? '✅ ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED'));
        console.log('═══════════════════════════════════\n');

        return results;
    } catch (error) {
        console.error('\n❌ Test suite error:', error);
        return results;
    }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.testWebRTC = {
        runAll: runAllTests,
        testSupport: testWebRTCSupport,
        testWebSocket: testWebSocketConnection,
        testMedia: testGetUserMedia,
        testPeerConnection: testPeerConnection
    };

    console.log('💡 WebRTC test utilities loaded!');
    console.log('Run: window.testWebRTC.runAll() to test everything');
}
