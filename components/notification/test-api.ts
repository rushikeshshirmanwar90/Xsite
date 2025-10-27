// Test file to verify API structure - you can delete this after testing

// Example of how the API call will be made:
export const testApiCall = async () => {
    console.log('Testing API call structure...');
    
    // This is what will be sent to your API:
    const testRequestId = 'test-id-123';
    const testApproval = true;
    
    console.log('API Endpoint:', '${domain}/api/sanction');
    console.log('Method:', 'POST');
    console.log('Body:', JSON.stringify({
        isApproved: testApproval,
        id: testRequestId
    }, null, 2));
    
    // Uncomment the line below to test the actual API call
    // const result = await sanctionMaterialRequest(testRequestId, testApproval);
    // console.log('API Result:', result);
};

// Example request body that will be sent:
export const exampleRequestBody = {
    isApproved: true,  // true for approve, false for reject
    id: "68fdd2fcbe475aeaef2d3fe3"  // This will be the material request ID
};