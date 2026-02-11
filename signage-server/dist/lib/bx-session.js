"use strict";
// Server-side BxSoftware session manager for signage server
// Maintains a persistent BxSID session for API calls
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBxSession = getBxSession;
exports.refreshBxSession = refreshBxSession;
exports.hasValidSession = hasValidSession;
let currentSession = null;
// BxSoftware credentials from environment variables
const BX_USERNAME = process.env.BX_USERNAME || '';
const BX_PASSWORD = process.env.BX_PASSWORD || '';
const BX_COMPANYCODE = process.env.BX_COMPANYCODE || '';
// Session expires after 12 hours
const SESSION_LIFETIME = 12 * 60 * 60 * 1000;
async function getBxSession() {
    // Check if we have valid credentials
    if (!BX_USERNAME || !BX_PASSWORD || !BX_COMPANYCODE) {
        console.error('BxSoftware credentials not configured in environment variables');
        return null;
    }
    // Check if current session is still valid
    if (currentSession && currentSession.expiresAt > Date.now()) {
        console.log('Using existing BxSoftware session');
        return currentSession.BxSID;
    }
    // Need to login - session expired or missing
    console.log('BxSoftware session expired or missing, logging in...');
    try {
        const loginResponse = await fetch('https://api.bxsoftware.no/1.0/Login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (compatible; SignageServer/1.0)',
            },
            body: JSON.stringify({
                username: BX_USERNAME,
                password: BX_PASSWORD,
                companycode: BX_COMPANYCODE,
            }),
        });
        if (!loginResponse.ok) {
            const errorText = await loginResponse.text();
            console.error('BxSoftware login failed:', loginResponse.status, errorText);
            return null;
        }
        // Extract BxSID from Set-Cookie header
        // Note: headers.get('set-cookie') can return a string or array depending on Node.js version
        const setCookieHeader = loginResponse.headers.get('set-cookie');
        if (!setCookieHeader) {
            console.error('No Set-Cookie header in login response');
            return null;
        }
        // Handle both string and array formats
        const setCookieString = Array.isArray(setCookieHeader)
            ? setCookieHeader.join('; ')
            : setCookieHeader;
        const bxSidMatch = setCookieString.match(/BxSID=([^;]+)/);
        if (!bxSidMatch) {
            console.error('BxSID not found in Set-Cookie header');
            console.log('Set-Cookie value:', setCookieString);
            return null;
        }
        const bxSid = bxSidMatch[1];
        // Store the session
        currentSession = {
            BxSID: bxSid,
            username: BX_USERNAME,
            companycode: BX_COMPANYCODE,
            expiresAt: Date.now() + SESSION_LIFETIME,
        };
        console.log('✅ BxSoftware session established successfully');
        return bxSid;
    }
    catch (error) {
        console.error('Error logging in to BxSoftware:', error);
        return null;
    }
}
// Force refresh the session
async function refreshBxSession() {
    currentSession = null;
    return await getBxSession();
}
// Check if session is valid without refreshing
function hasValidSession() {
    return currentSession !== null && currentSession.expiresAt > Date.now();
}
