
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testAuth() {
    console.log('--- Starting Auth Verification ---');

    try {
        // 1. Public Access (should fail for protected routes)
        console.log('\nTest 1: Public Access to Protected Route');
        try {
            await axios.get(`${API_URL}/workflow/admin/roles`);
            console.error('FAIL: Protected route accessed without token');
        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log('PASS: Correctly rejected with 401');
            } else {
                console.error(`FAIL: Unexpected status ${error.response?.status}`);
            }
        }

        // 2. Invalid Token
        console.log('\nTest 2: Invalid Token');
        try {
            await axios.get(`${API_URL}/workflow/admin/roles`, {
                headers: { Authorization: 'Bearer invalid_token_123' }
            });
            console.error('FAIL: Invalid token accepted');
        } catch (error) {
            if (error.response && error.response.status === 401) { // Middleware returns 401 for invalid token
                console.log('PASS: Correctly rejected with 401');
            } else {
                console.error(`FAIL: Unexpected status ${error.response?.status}`);
            }
        }

        console.log('\n--- Verification Complete ---');

    } catch (err) {
        console.error('Test Execution Error:', err.message);
    }
}

testAuth();
