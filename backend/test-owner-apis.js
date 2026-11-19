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

async function runTests() {
  console.log("=== STARTING VASATI OWNER PORTAL BACKEND TESTS ===");

  // 1. Owner Login
  console.log("\n[Test 1] Testing Owner Login for Rajesh Kulkarni (owner@vasatipg.com)...");
  const loginRes = await makeRequest({
    path: "/api/owner/login",
    method: "POST",
    body: { email: "owner@vasatipg.com", password: "Password@123" },
  });
  assert.strictEqual(loginRes.status, 200, "Login should succeed with code 200");
  assert.ok(loginRes.data.token, "Token should be returned");
  const token = loginRes.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };
  console.log("✔ Owner Login passed! Token acquired.");

  // 2. Dashboard Summary
  console.log("\n[Test 2] Testing Dashboard Summary...");
  const summaryRes = await makeRequest({
    path: "/api/owner/dashboard/summary",
    headers: authHeaders,
  });
  assert.strictEqual(summaryRes.status, 200);
  assert.ok(summaryRes.data.summary.totalProperties >= 1, "Should have at least 1 property");
  assert.ok(summaryRes.data.summary.totalCustomers >= 1, "Should have customers");
  assert.ok(summaryRes.data.summary.monthlyRentCollection > 0, "Monthly collection should be > 0");
  console.log(`✔ Dashboard summary passed! Total Properties: ${summaryRes.data.summary.totalProperties}, Active Residents: ${summaryRes.data.summary.activeResidents}, Monthly Rent: ₹${summaryRes.data.summary.monthlyRentCollection}`);

  // 3. Customer List & Masking
  console.log("\n[Test 3] Testing Customer Management & Phone Masking...");
  const custRes = await makeRequest({
    path: "/api/owner/customers",
    headers: authHeaders,
  });
  assert.strictEqual(custRes.status, 200);
  assert.ok(Array.isArray(custRes.data), "Customers should be array");
  assert.ok(custRes.data.length > 0, "Customers should not be empty");
  const firstCust = custRes.data[0];
  assert.ok(firstCust.mobileNumberMasked.includes("******"), "Mobile number must be masked by default for privacy");
  console.log(`✔ Customer list passed! ${custRes.data.length} customers fetched. Sample masked phone: ${firstCust.mobileNumberMasked}`);

  // 4. Detailed Customer Profile
  console.log("\n[Test 4] Testing Detailed Customer Profile...");
  const profileRes = await makeRequest({
    path: `/api/owner/customers/${firstCust.customerId}`,
    headers: authHeaders,
  });
  assert.strictEqual(profileRes.status, 200);
  assert.strictEqual(profileRes.data.customerId, firstCust.customerId);
  assert.ok(Array.isArray(profileRes.data.paymentHistory), "Should include payment history");
  console.log(`✔ Customer profile passed for ${profileRes.data.fullName} with ${profileRes.data.paymentHistory.length} payment records.`);

  // 5. Booking Management
  console.log("\n[Test 5] Testing Booking Management & Confirmation...");
  const bookingsRes = await makeRequest({
    path: "/api/owner/bookings",
    headers: authHeaders,
  });
  assert.strictEqual(bookingsRes.status, 200);
  const pendingBooking = bookingsRes.data.find((b) => b.status === "New Enquiry" || b.status === "Booking Pending");
  if (pendingBooking) {
    const acceptRes = await makeRequest({
      path: `/api/owner/bookings/${pendingBooking.bookingId}/accept`,
      method: "POST",
      headers: authHeaders,
      body: { roomNumber: "103", bedNumber: "103-B" },
    });
    assert.strictEqual(acceptRes.status, 200);
    assert.strictEqual(acceptRes.data.booking.status, "Confirmed");
    console.log(`✔ Booking ${pendingBooking.bookingId} accepted and confirmed for Room 103, Bed 103-B.`);
  } else {
    console.log("✔ Bookings list checked (no pending bookings to accept).");
  }

  // 6. Record Payment & Receipt Generation
  console.log("\n[Test 6] Testing Payment Recording & Receipt Generation...");
  const payRes = await makeRequest({
    path: "/api/owner/payments/record",
    method: "POST",
    headers: authHeaders,
    body: {
      customerId: firstCust.customerId,
      propertyId: firstCust.propertyId,
      amount: 9500,
      month: "November 2026",
      paymentMethod: "UPI",
      transactionRef: "UPI/TEST-UTR-998811",
      notes: "Test verified payment",
    },
  });
  assert.strictEqual(payRes.status, 201);
  assert.ok(payRes.data.payment.receiptNumber.startsWith("REC-"), "Receipt number generated");
  console.log(`✔ Payment recorded successfully! Receipt: ${payRes.data.payment.receiptNumber}, Amount: ₹${payRes.data.payment.amount}`);

  // 7. Visit Management
  console.log("\n[Test 7] Testing Visit Management...");
  const visitsRes = await makeRequest({
    path: "/api/owner/visits",
    headers: authHeaders,
  });
  assert.strictEqual(visitsRes.status, 200);
  if (visitsRes.data.length > 0) {
    const v = visitsRes.data[0];
    const updateV = await makeRequest({
      path: `/api/owner/visits/${v.visitId}`,
      method: "PUT",
      headers: authHeaders,
      body: { status: "Accepted", ownerNotes: "Confirmed for tour" },
    });
    assert.strictEqual(updateV.status, 200);
    console.log(`✔ Visit ${v.visitId} status updated to Accepted.`);
  }

  // 8. Complaint Management
  console.log("\n[Test 8] Testing Complaint Response...");
  const complaintsRes = await makeRequest({
    path: "/api/owner/complaints",
    headers: authHeaders,
  });
  assert.strictEqual(complaintsRes.status, 200);
  if (complaintsRes.data.length > 0) {
    const c = complaintsRes.data[0];
    const respondC = await makeRequest({
      path: `/api/owner/complaints/${c.complaintId}/respond`,
      method: "PUT",
      headers: authHeaders,
      body: { status: "Resolved", ownerResponse: "Issue investigated and resolved promptly.", resolutionNotes: "Verified." },
    });
    assert.strictEqual(respondC.status, 200);
    console.log(`✔ Complaint ${c.complaintId} responded and resolved.`);
  }

  // 9. Analytics
  console.log("\n[Test 9] Testing Analytics Endpoint...");
  const analyticsRes = await makeRequest({
    path: "/api/owner/analytics",
    headers: authHeaders,
  });
  assert.strictEqual(analyticsRes.status, 200);
  assert.ok(analyticsRes.data.occupancyTrend.length > 0, "Occupancy trend should be present");
  console.log(`✔ Analytics passed! Conversion rate: ${analyticsRes.data.conversionRate}%, Resolution rate: ${analyticsRes.data.resolutionRate}%`);

  // 10. Strict Server-side Access Control (Cross-Owner Isolation)
  console.log("\n[Test 10] Testing Strict Cross-Owner Isolation...");
  // Owner 2 login
  const owner2Login = await makeRequest({
    path: "/api/owner/login",
    method: "POST",
    body: { email: "suresh.pg@vasati.in", password: "Password@123" },
  });
  assert.strictEqual(owner2Login.status, 200);
  const owner2Token = owner2Login.data.token;
  const owner2Headers = { Authorization: `Bearer ${owner2Token}` };

  // Owner 2 attempts to access Owner 1's customer directly by ID
  const forbiddenAccess = await makeRequest({
    path: `/api/owner/customers/${firstCust.customerId}`,
    headers: owner2Headers,
  });
  assert.strictEqual(forbiddenAccess.status, 403, "Owner 2 must receive 403 Forbidden when accessing Owner 1 customer!");
  console.log(`✔ Strict security verified! Owner 2 received status ${forbiddenAccess.status} Forbidden when querying customer ${firstCust.customerId}`);

  console.log("\n🎉 ALL 10 OWNER PORTAL BACKEND TEST SUITES PASSED FLAWLESSLY! 🎉");
  process.exit(0);
}

// Start server and run tests
const serverProcess = require("./server.js");
setTimeout(() => {
  runTests().catch((err) => {
    console.error("Test failure:", err);
    process.exit(1);
  });
}, 1500);

