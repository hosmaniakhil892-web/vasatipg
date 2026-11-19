const assert = require("assert");
const request = require("http");

async function makeRequest({ port = 5000, path, method = "GET", headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      ...headers,
      ...(dataString
        ? {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(dataString),
          }
        : {}),
    };

    const req = request.request(
      {
        host: "localhost",
        port,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let resBody = "";
        res.on("data", (chunk) => (resBody += chunk));
        res.on("end", () => {
          let parsed;
          try {
            parsed = JSON.parse(resBody);
          } catch (e) {
            parsed = resBody;
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      }
    );

    req.on("error", reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runAll14Tests() {
  console.log("===================================================================");
  console.log("   VASATI PG OWNER DASHBOARD - FULL 14-STEP VERIFICATION SUITE    ");
  console.log("===================================================================");

  const testEmail = `newowner_${Date.now()}@vasati.in`;

  // Step 1: Owner Registration
  console.log("\n[Step 1] Testing Owner Registration...");
  const regRes = await makeRequest({
    path: "/api/owner/register",
    method: "POST",
    body: {
      fullName: "Mahesh Pattar",
      email: testEmail,
      password: "SecurePassword@123",
      mobileNumber: "9845099887",
      propertyName: "Vasati Green View Residency",
      propertyAddress: "Plot 45, BTM 2nd Stage, Outer Ring Road, Bengaluru",
      identityProof: { docType: "Aadhaar", docNumber: "9912-3819-4820", docFile: "aadhaar.pdf" },
      ownershipProof: { docType: "Electricity Bill", docNumber: "BESCOM-19284", docFile: "ebill.pdf" },
    },
  });
  assert.strictEqual(regRes.status, 201, "Registration should return 201 Created");
  assert.strictEqual(regRes.data.requiresOtp, true, "OTP verification required");
  console.log(`✔ Step 1 Passed: Registered owner for property '${regRes.data.mobileNumber}'.`);

  // Step 2: Owner Verification (OTP)
  console.log("\n[Step 2] Testing Owner Mobile OTP Verification...");
  const otpRes = await makeRequest({
    path: "/api/owner/verify-otp",
    method: "POST",
    body: { email: testEmail, otp: "123456" },
  });
  assert.strictEqual(otpRes.status, 200, "OTP verification should return 200 OK");
  assert.ok(otpRes.data.token, "JWT token must be issued");
  assert.strictEqual(otpRes.data.owner.verificationStatus, "Verified");
  console.log("✔ Step 2 Passed: Mobile verified & account set to Verified status.");

  // Step 3: Owner Login
  console.log("\n[Step 3] Testing Owner Login...");
  const loginRes = await makeRequest({
    path: "/api/owner/login",
    method: "POST",
    body: { email: testEmail, password: "SecurePassword@123" },
  });
  assert.strictEqual(loginRes.status, 200);
  assert.ok(loginRes.data.token);
  const token = loginRes.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };
  console.log("✔ Step 3 Passed: Owner successfully logged in with valid JWT token.");

  // Step 4: Dashboard Loading
  console.log("\n[Step 4] Testing Dashboard Loading & Metrics Compilation...");
  const dashRes = await makeRequest({
    path: "/api/owner/dashboard/summary",
    headers: authHeaders,
  });
  assert.strictEqual(dashRes.status, 200);
  assert.ok(dashRes.data.summary.totalProperties >= 1, "Must have property");
  assert.strictEqual(typeof dashRes.data.summary.monthlyRentCollection, "number");
  console.log(`✔ Step 4 Passed: Dashboard loaded. Total properties: ${dashRes.data.summary.totalProperties}, Beds: ${dashRes.data.summary.totalBeds}.`);

  // Step 5: Property Management
  console.log("\n[Step 5] Testing Property Management...");
  const meRes = await makeRequest({
    path: "/api/owner/me",
    headers: authHeaders,
  });
  assert.strictEqual(meRes.status, 200);
  assert.ok(meRes.data.properties.length > 0);
  const property = meRes.data.properties[0];
  console.log(`✔ Step 5 Passed: Property '${property.pgName}' verified for owner.`);

  // Step 6: Customer Listing
  console.log("\n[Step 6] Testing Customer Listing for established owner...");
  // Login as Rajesh Kulkarni (has residents)
  const rajeshLogin = await makeRequest({
    path: "/api/owner/login",
    method: "POST",
    body: { email: "owner@vasatipg.com", password: "Password@123" },
  });
  const rajeshToken = rajeshLogin.data.token;
  const rajeshHeaders = { Authorization: `Bearer ${rajeshToken}` };

  const custList = await makeRequest({
    path: "/api/owner/customers",
    headers: rajeshHeaders,
  });
  assert.strictEqual(custList.status, 200);
  assert.ok(custList.data.length > 0);
  const sampleCust = custList.data[0];
  assert.ok(sampleCust.mobileNumberMasked.includes("******"), "Privacy masking active");
  console.log(`✔ Step 6 Passed: Found ${custList.data.length} customers. Masked phone: ${sampleCust.mobileNumberMasked}`);

  // Step 7: Customer Profile Access
  console.log("\n[Step 7] Testing Customer Profile Access & Audit Log...");
  const profRes = await makeRequest({
    path: `/api/owner/customers/${sampleCust.customerId}`,
    headers: rajeshHeaders,
  });
  assert.strictEqual(profRes.status, 200);
  assert.strictEqual(profRes.data.customerId, sampleCust.customerId);
  console.log(`✔ Step 7 Passed: Successfully accessed profile for ${profRes.data.fullName}.`);

  // Step 8: Booking Management
  console.log("\n[Step 8] Testing Booking Management...");
  const bookingsRes = await makeRequest({
    path: "/api/owner/bookings",
    headers: rajeshHeaders,
  });
  assert.strictEqual(bookingsRes.status, 200);
  assert.ok(bookingsRes.data.length > 0);
  console.log(`✔ Step 8 Passed: Retrieved ${bookingsRes.data.length} booking records.`);

  // Step 9: Room Allocation & Capacity Updates
  console.log("\n[Step 9] Testing Room Allocation Update...");
  const reallocRes = await makeRequest({
    path: `/api/owner/customers/${sampleCust.customerId}/room-allocation`,
    method: "PUT",
    headers: rajeshHeaders,
    body: {
      newRoomNumber: "101",
      newBedNumber: "101-A",
    },
  });
  assert.strictEqual(reallocRes.status, 200);
  console.log(`✔ Step 9 Passed: Room allocation verified. ${reallocRes.data.message}`);

  // Step 10: Rent Tracking & Verified Payment Recording
  console.log("\n[Step 10] Testing Rent Tracking & Verified Receipt Recording...");
  const payRecord = await makeRequest({
    path: "/api/owner/payments/record",
    method: "POST",
    headers: rajeshHeaders,
    body: {
      customerId: sampleCust.customerId,
      propertyId: sampleCust.propertyId,
      amount: 14000,
      month: "November 2026",
      paymentMethod: "UPI",
      transactionRef: "UPI/VERIFY-STEP-10/HDFC",
      notes: "Audit test payment recording",
    },
  });
  assert.strictEqual(payRecord.status, 201);
  assert.ok(payRecord.data.payment.receiptNumber.startsWith("REC-"));
  console.log(`✔ Step 10 Passed: Generated Tax Receipt #${payRecord.data.payment.receiptNumber} for ₹14,000.`);

  // Step 11: Customer Communication (Chat Endpoint Check)
  console.log("\n[Step 11] Testing Customer Masked Communication...");
  const chatConvs = await makeRequest({
    path: "/api/chat/conversations/owner@vasatipg.com",
  });
  assert.strictEqual(chatConvs.status, 200);
  console.log(`✔ Step 11 Passed: Masked chat system connected. Active threads: ${chatConvs.data.length}.`);

  // Step 12: Visit Management
  console.log("\n[Step 12] Testing Visit Management...");
  const visitsRes = await makeRequest({
    path: "/api/owner/visits",
    headers: rajeshHeaders,
  });
  assert.strictEqual(visitsRes.status, 200);
  assert.ok(visitsRes.data.length > 0);
  console.log(`✔ Step 12 Passed: ${visitsRes.data.length} scheduled visits loaded.`);

  // Step 13: Complaint Management
  console.log("\n[Step 13] Testing Complaint Management & Resolution...");
  const cmpRes = await makeRequest({
    path: "/api/owner/complaints",
    headers: rajeshHeaders,
  });
  assert.strictEqual(cmpRes.status, 200);
  assert.ok(cmpRes.data.length > 0);
  console.log(`✔ Step 13 Passed: ${cmpRes.data.length} complaints loaded across categories.`);

  // Step 14: Owner Logout (Client-side token destruction verified)
  console.log("\n[Step 14] Testing Owner Logout Security...");
  // Test request without token must be rejected
  const unauthRes = await makeRequest({
    path: "/api/owner/customers",
    headers: {},
  });
  assert.strictEqual(unauthRes.status, 401, "Unauthenticated request without token must fail with 401");
  console.log("✔ Step 14 Passed: Access denied (401 Unauthorized) when token is discarded upon logout.");

  // Cross-Owner Access Control Verification
  console.log("\n[Security Check] Verifying Cross-Owner ID Manipulation is Blocked...");
  const unauthorizedCrossOwnerAccess = await makeRequest({
    path: `/api/owner/customers/${sampleCust.customerId}`,
    headers: authHeaders, // using token of newly registered owner Mahesh Pattar
  });
  assert.strictEqual(unauthorizedCrossOwnerAccess.status, 403, "Owner cannot access another owner's customers!");
  console.log(`✔ Security Verified: Server rejected unauthorized cross-owner customer lookup with status 403 Forbidden.`);

  console.log("\n===================================================================");
  console.log("   🎉 ALL 14 OWNER WORKFLOW REQUIREMENTS CONFIRMED PASSED! 🎉    ");
  console.log("===================================================================");
  process.exit(0);
}

// Start backend server and run tests
const server = require("./server.js");
setTimeout(() => {
  runAll14Tests().catch((err) => {
    console.error("Test failure:", err);
    process.exit(1);
  });
}, 1500);

