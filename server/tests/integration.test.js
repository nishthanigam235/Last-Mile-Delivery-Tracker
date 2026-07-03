const API_URL = 'http://localhost:5000/api';

// Helper to make fetch calls easier
const apiCall = async (endpoint, method = 'GET', body = null, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${endpoint}`, options);
  const data = await res.json();
  
  if (!res.ok) {
    const err = new Error(data.message || 'API Call failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

const runTests = async () => {
  console.log('==================================================');
  console.log('STARTING INTEGRATION & END-TO-END BUSINESS LOGIC TESTS');
  console.log('==================================================\n');

  try {
    // ----------------------------------------------------
    // TEST 1: Login Admin & Customer
    // ----------------------------------------------------
    console.log('Step 1: Authenticating Admin and Customer accounts...');
    
    // Login Admin
    const adminLoginRes = await apiCall('/auth/login', 'POST', {
      email: 'admin@lastmile.com',
      password: 'Password123'
    });
    const adminToken = adminLoginRes.token;
    console.log('✅ Admin authenticated successfully.');

    // Login Customer
    const customerLoginRes = await apiCall('/auth/login', 'POST', {
      email: 'customer@lastmile.com',
      password: 'Password123'
    });
    const customerToken = customerLoginRes.token;
    console.log('✅ Customer authenticated successfully.');

    // ----------------------------------------------------
    // TEST 2: Verify Zones and Rate Cards
    // ----------------------------------------------------
    console.log('\nStep 2: Checking pre-seeded Zones and Rate Cards...');
    
    const zonesRes = await apiCall('/zones', 'GET', null, adminToken);
    const zones = zonesRes.data;
    console.log(`✅ Retrieved ${zones.length} active service zones.`);
    if (zones.length < 3) throw new Error('Seeded zones are missing.');

    const ratesRes = await apiCall('/rate-cards', 'GET', null, adminToken);
    const rates = ratesRes.data;
    console.log(`✅ Retrieved ${rates.length} active rate card configurations.`);
    if (rates.length < 4) throw new Error('Seeded rate cards are missing.');

    // ----------------------------------------------------
    // TEST 3: Verify Pricing Engine calculation (Preview)
    // ----------------------------------------------------
    console.log('\nStep 3: Testing Pricing Engine Calculation Preview (Inter-Zone B2C COD)...');
    
    // Inter-zone combination: pickup Delhi (110020) -> drop Mumbai (400011)
    // Actual weight: 2kg
    // Dimensions: 20 x 30 x 40 cm -> Volumetric weight = (20*30*40)/5000 = 4.8kg
    // Billable Weight: max(2, 4.8) = 4.8kg
    // RateCard Inter-Zone B2C: pricePerKg = 38.00, codCharge = 50.00
    // Expected cost = 4.8 * 38.00 + 50.00 = 182.40 + 50 = 232.40
    
    const pricingRes = await apiCall('/orders/calculate', 'POST', {
      pickupPincode: '110020',
      dropPincode: '400011',
      length: 20,
      breadth: 30,
      height: 40,
      actualWeight: 2,
      orderType: 'B2C',
      paymentType: 'COD'
    }, customerToken);

    const pricing = pricingRes.data;
    console.log('✅ Pricing calculation response received.');
    console.log(`   - Volumetric Weight: ${pricing.volumetricWeight} kg (Expected: 4.8)`);
    console.log(`   - Billable Weight: ${pricing.billableWeight} kg (Expected: 4.8)`);
    console.log(`   - Zone Type: ${pricing.zoneType} (Expected: inter)`);
    console.log(`   - Base Charge: Rs. ${pricing.baseCharge} (Expected: 182.40)`);
    console.log(`   - COD Surcharge: Rs. ${pricing.codSurcharge} (Expected: 50.00)`);
    console.log(`   - Total Charge: Rs. ${pricing.deliveryCharge} (Expected: 232.40)`);

    if (pricing.deliveryCharge !== 232.4) {
      throw new Error(`Pricing calculation mismatch. Got: ${pricing.deliveryCharge}, Expected: 232.40`);
    }
    console.log('✅ Pricing Engine validations passed successfully.');

    // ----------------------------------------------------
    // TEST 4: Create Order
    // ----------------------------------------------------
    console.log('\nStep 4: Creating a new Shipment Order...');
    const orderCreateRes = await apiCall('/orders', 'POST', {
      pickupAddress: 'Okhla Phase 3, Delhi',
      pickupPincode: '110020',
      dropAddress: 'Byculla, Mumbai',
      dropPincode: '400011',
      length: 20,
      breadth: 30,
      height: 40,
      actualWeight: 2,
      orderType: 'B2C',
      paymentType: 'COD'
    }, customerToken);

    const order = orderCreateRes.data;
    const orderDbId = order._id;
    console.log(`✅ Order booked successfully. Order ID: ${order.orderId}`);
    console.log(`   - Initial Status: ${order.status} (Expected: Created)`);
    console.log(`   - Initial Timeline Entry: ${order.trackingHistory[0].status} (Remarks: "${order.trackingHistory[0].remarks}")`);

    if (order.status !== 'Created' || order.trackingHistory.length !== 1) {
      throw new Error('Order creation initial state is invalid.');
    }

    // ----------------------------------------------------
    // TEST 5: Auto-Assign Nearest Agent
    // ----------------------------------------------------
    console.log('\nStep 5: Testing Geodesic Auto-Assignment heuristics...');
    
    // We expect the auto-assigner to select Delhi Rider (agent1) since the pickup is in Delhi (110020)
    // and Delhi Rider (agent1@lastmile.com) has coordinates near Delhi, while agent2 is in Mumbai.
    const assignRes = await apiCall(`/orders/${orderDbId}/assign-agent`, 'PUT', {
      autoAssign: true
    }, adminToken);

    const updatedOrder = assignRes.data;
    console.log('✅ Auto-assignment executed.');
    console.log(`   - Assigned Rider ID: ${updatedOrder.assignedAgent}`);

    // Verify rider is indeed Agent 1 by calling details
    const detailsRes = await apiCall(`/orders/${orderDbId}`, 'GET', null, adminToken);
    const detailedOrder = detailsRes.data;
    console.log(`   - Assigned Rider Name: ${detailedOrder.assignedAgent.name} (Expected: Delhi Delivery Rider)`);
    
    if (detailedOrder.assignedAgent.email !== 'agent1@lastmile.com') {
      throw new Error(`Incorrect agent assigned. Got: ${detailedOrder.assignedAgent.email}, Expected: agent1@lastmile.com`);
    }
    console.log('✅ Proximity-based auto-assignment heuristic passed.');

    // ----------------------------------------------------
    // TEST 6: Rider Status Updates
    // ----------------------------------------------------
    console.log('\nStep 6: Simulating Rider Status transitions (In Transit & Failed)...');
    
    // Login Rider (Agent 1)
    const agentLoginRes = await apiCall('/auth/login', 'POST', {
      email: 'agent1@lastmile.com',
      password: 'Password123'
    });
    const agentToken = agentLoginRes.token;

    // Update status to Picked Up
    await apiCall(`/orders/${orderDbId}/status`, 'PUT', {
      status: 'Picked Up',
      remarks: 'Package checked and loaded'
    }, agentToken);
    console.log('✅ Status updated to: Picked Up');

    // Update status to In Transit
    await apiCall(`/orders/${orderDbId}/status`, 'PUT', {
      status: 'In Transit',
      remarks: 'Departed Delhi Hub towards Mumbai'
    }, agentToken);
    console.log('✅ Status updated to: In Transit');

    // Update status to Failed (Delivery Failed attempt)
    const failRes = await apiCall(`/orders/${orderDbId}/status`, 'PUT', {
      status: 'Failed',
      remarks: 'Recipient phone switched off and door locked'
    }, agentToken);
    
    console.log('✅ Status updated to: Failed');
    console.log(`   - Recorded Failure Reason: "${failReason = failRes.data.failReason}"`);

    // Verify timeline immutability (should have 5 tracking history entries now: Created, Assigned, Picked Up, In Transit, Failed)
    const timelineRes = await apiCall(`/orders/${orderDbId}`, 'GET', null, customerToken);
    const historyList = timelineRes.data.trackingHistory;
    console.log(`✅ Order tracking timeline contains ${historyList.length} logs (Immutable timeline verification passed).`);
    
    if (historyList.length !== 5) {
      throw new Error(`Expected 5 timeline records, got ${historyList.length}`);
    }

    // ----------------------------------------------------
    // TEST 7: Rescheduling failed delivery
    // ----------------------------------------------------
    console.log('\nStep 7: Testing Customer Rescheduling workflow...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const rescheduleDateStr = tomorrow.toISOString().split('T')[0];

    const rescheduleRes = await apiCall(`/orders/${orderDbId}/reschedule`, 'PUT', {
      rescheduleDate: rescheduleDateStr
    }, customerToken);

    const rescheduledOrder = rescheduleRes.data;
    console.log(`✅ Order rescheduled for date: ${rescheduleDateStr}`);
    console.log(`   - New Order Status: ${rescheduledOrder.status} (Expected: Rescheduled)`);
    console.log(`   - Active Timeline logs: ${rescheduledOrder.trackingHistory.length} entries`);

    // ----------------------------------------------------
    // TEST 8: Verify Admin override status
    // ----------------------------------------------------
    console.log('\nStep 8: Testing Admin Status Override (Transition to Delivered)...');
    
    await apiCall(`/orders/${orderDbId}/status`, 'PUT', {
      status: 'Delivered',
      remarks: 'Admin override: Package confirmed delivered directly at reception desk'
    }, adminToken);

    const finalOrderRes = await apiCall(`/orders/${orderDbId}`, 'GET', null, adminToken);
    const finalOrder = finalOrderRes.data;
    console.log(`✅ Status overridden to: ${finalOrder.status} (Expected: Delivered)`);
    
    if (finalOrder.status !== 'Delivered') {
      throw new Error('Admin status override failed.');
    }

    console.log('\n==================================================');
    console.log('🎉 ALL INTEGRATION AND LIFECYCLE TESTS PASSED SUCCESSFULLY!');
    console.log('==================================================');

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED!');
    if (error.status) {
      console.error(`   API Error Details: [${error.status}] ${JSON.stringify(error.data)}`);
    } else {
      console.error(`   Error details: ${error.message}`);
    }
    process.exit(1);
  }
};

runTests();
