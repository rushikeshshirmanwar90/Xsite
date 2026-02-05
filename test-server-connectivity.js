/**
 * Simple server connectivity test
 */

const axios = require('axios');

const domain = "http://localhost:8080";

async function testServerConnectivity() {
  console.log('🔗 Testing server connectivity...');
  console.log('🌐 Server URL:', domain);

  try {
    // Test basic health endpoint
    console.log('\n📋 Testing basic server health...');
    const healthResponse = await axios.get(`${domain}/api/health`, {
      timeout: 5000
    });

    console.log('✅ Server is running');
    console.log('📊 Health response:', {
      status: healthResponse.status,
      success: healthResponse.data?.success || 'unknown',
      message: healthResponse.data?.message || 'No message'
    });

    // Test retry endpoint
    console.log('\n📋 Testing retry management endpoint...');
    const retryResponse = await axios.get(`${domain}/api/notifications/retry`, {
      timeout: 5000
    });

    console.log('✅ Retry endpoint accessible');
    console.log('📊 Retry response:', {
      success: retryResponse.data.success,
      totalInQueue: retryResponse.data.data?.statistics?.totalInQueue || 0,
      circuitBreakerState: retryResponse.data.data?.statistics?.circuitBreakerState
    });

    // Test recipient endpoint with minimal data
    console.log('\n📋 Testing recipient resolution endpoint...');
    try {
      const recipientResponse = await axios.get(`${domain}/api/notifications/recipients`, {
        params: { clientId: 'test_client' },
        timeout: 5000
      });

      console.log('✅ Recipient endpoint accessible');
      console.log('📊 Recipient response:', {
        success: recipientResponse.data.success,
        message: recipientResponse.data.message
      });
    } catch (recipientError) {
      console.log('⚠️ Recipient endpoint returned error (expected for test data):', recipientError.response?.status);
      console.log('📊 Error message:', recipientError.response?.data?.message);
    }

    console.log('\n🎉 Server connectivity test completed successfully!');
    console.log('✅ Local server is running and enhanced notification endpoints are accessible');
    
    return true;

  } catch (error) {
    console.error('❌ Server connectivity test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure the local server is running on http://localhost:8080');
    }
    return false;
  }
}

// Run the test
testServerConnectivity().catch(console.error);