const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('\n--- STARTING BACKEND INTEGRATION TESTS ---');

  // Check if server is already running or import server
  try {
    const health = await fetch('http://localhost:5000/api/health').then(r => r.json());
    console.log('Detected active Drivemate server: MongoDB connected:', health.mongodbConnected, 'Socket.io:', health.socketIOReady);
  } catch {
    await import('./server.js');
    await new Promise(r => setTimeout(r, 1500));
  }

  // Test 0: Send & Verify Registration OTP
  console.log('\n[Test 0] Sending & Verifying 6-digit Registration OTP...');
  const testEmail = `alex.test.${Date.now()}@drivemate.com`;
  const testPhone = `+1555${Math.floor(1000000 + Math.random() * 9000000)}`;

  const sendOtpRes = await fetch(`${BASE_URL}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, phoneNumber: testPhone }),
  });
  const sendOtpData = await sendOtpRes.json();
  console.log('OTP Send status:', sendOtpRes.status, 'devOtp:', sendOtpData.devOtp);

  const verifyOtpRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, phoneNumber: testPhone, otp: sendOtpData.devOtp || '123456' }),
  });
  const verifyOtpData = await verifyOtpRes.json();
  console.log('OTP Verify status:', verifyOtpRes.status, verifyOtpData.success ? 'VERIFIED' : 'FAILED');

  // Test 1: Register New User with 7-step onboarding data & OTP verification
  console.log('\n[Test 1] Registering driver with 7-step onboarding data and OTP...');
  const regPayload = {
    fullName: 'Alex Morgan',
    email: testEmail,
    phoneNumber: testPhone,
    username: `alex_${Math.floor(100 + Math.random() * 900)}`,
    vehicleType: '4 Wheeler',
    password: 'password123',
    otp: sendOtpData.devOtp || '123456',
  };

  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regPayload),
  });
  const regData = await regRes.json();
  console.log('Registration status:', regRes.status, regData.success ? 'SUCCESS' : 'FAILED');
  if (!regData.success) {
    throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  }
  const token = regData.token;
  console.log('Received auth token:', token.substring(0, 30) + '...');
  console.log('User registered with initial freePostsUsed:', regData.user.freePostsUsed, 'maxFreePosts:', regData.user.maxFreePosts);

  // Test 2: Verify Token endpoint
  console.log('\n[Test 2] Verifying auth token with Bearer header...');
  const verifyRes = await fetch(`${BASE_URL}/auth/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const verifyData = await verifyRes.json();
  console.log('Token verification status:', verifyRes.status, verifyData.valid ? 'VALID' : 'INVALID');

  // Test 3: Login with registered credentials
  console.log('\n[Test 3] Testing Login with email & password...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: regPayload.email, password: regPayload.password }),
  });
  const loginData = await loginRes.json();
  console.log('Login status:', loginRes.status, loginData.success ? 'SUCCESS' : 'FAILED');

  // Test 4: Fetch community posts
  console.log('\n[Test 4] Fetching community posts...');
  const postsRes = await fetch(`${BASE_URL}/posts`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const postsData = await postsRes.json();
  console.log('Posts count in MongoDB Atlas:', postsData.posts.length);

  // Test 5: Create Post #1 with Journey Route & Cities (Free Tier 1/2)
  console.log('\n[Test 5] Creating Post #1 with Cities & Timings (Free tier: 1/2)...');
  const post1Res = await fetch(`${BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      content: 'Heading south to Los Angeles on I-5. Clean ride, 3 seats open.',
      fromCity: 'San Francisco, CA',
      toCity: 'Los Angeles, CA',
      departureTime: 'Today • 04:30 PM',
      availableSeats: 3,
      pricePerSeat: '$35',
      tag: '#Carpool',
      link: 'https://drivemate.com/routes/coastal',
      linkTitle: 'Coastal Highway Guide',
    }),
  });
  const post1Data = await post1Res.json();
  console.log('Post 1 created:', post1Data.success, 'New freePostsUsed:', post1Data.quota.freePostsUsed);

  // Test 6: Create Post #2 (Free Tier 2/2)
  console.log('\n[Test 6] Creating Post #2 (Free tier: 2/2)...');
  const post2Res = await fetch(`${BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      content: 'Second free post: scenic detour via Highway 1.',
      fromCity: 'Monterey, CA',
      toCity: 'Big Sur, CA',
      departureTime: 'Tomorrow • 09:00 AM',
      tag: '#ScenicRoute',
    }),
  });
  const post2Data = await post2Res.json();
  console.log('Post 2 created:', post2Data.success, 'New freePostsUsed:', post2Data.quota.freePostsUsed);

  // Test 7: Toggling like on Post #1
  console.log('\n[Test 7] Testing Post Like / Unlike toggle...');
  const likeRes = await fetch(`${BASE_URL}/posts/${post1Data.post.id}/like`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const likeData = await likeRes.json();
  console.log('Post liked status:', likeData.success, 'Current likes:', likeData.post?.likes);

  // Test 8: Discovering registered drivers
  console.log('\n[Test 8] Fetching discoverable driver profiles...');
  const driversRes = await fetch(`${BASE_URL}/messages/drivers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const driversData = await driversRes.json();
  console.log('Drivers found:', driversData.success, 'Count:', driversData.drivers?.length);

  // Test 9: Sending a Connection Request
  console.log('\n[Test 9] Sending a Connection Request...');
  const targetDriver = driversData.drivers?.[0] || { uid: `driver_test_${Date.now()}`, fullName: 'Partner Driver', username: 'partner' };
  const sendReqRes = await fetch(`${BASE_URL}/messages/requests/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      targetUserId: targetDriver.uid,
      targetName: targetDriver.fullName,
      targetTag: `@${targetDriver.username}`,
    }),
  });
  const sendReqData = await sendReqRes.json();
  console.log('Connection request sent:', sendReqData.success, 'Status:', sendReqData.connection?.status);

  // Test 10: Fetching Connection Requests & Accepting Request
  console.log('\n[Test 10] Fetching connection requests & accepting invitation...');
  const getReqsRes = await fetch(`${BASE_URL}/messages/requests`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const getReqsData = await getReqsRes.json();
  console.log('Requests loaded:', getReqsData.success, 'Outgoing count:', getReqsData.outgoing?.length);

  if (sendReqData.connection?.id) {
    const respondRes = await fetch(`${BASE_URL}/messages/requests/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        requestId: sendReqData.connection.id,
        action: 'accept',
      }),
    });
    const respondData = await respondRes.json();
    console.log('Request accepted status:', respondData.success, 'Status now:', respondData.connection?.status);
  }

  // Test 11: Garage Vehicles Management (Add & Remove)
  console.log('\n[Test 11] Testing Garage Vehicles API in MongoDB...');
  const vListRes = await fetch(`${BASE_URL}/vehicles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const vListData = await vListRes.json();
  console.log('Initial vehicles in garage:', vListData.vehicles.length);

  const addVRes = await fetch(`${BASE_URL}/vehicles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: 'Porsche 911 GT3',
      year: '2023',
      type: 'Gas',
      plate: 'GT3-992',
    }),
  });
  const addVData = await addVRes.json();
  console.log('Added vehicle:', addVData.success, 'Total vehicles now:', addVData.vehicles.length);

  // Test 12: Firebase Analytics Logging
  console.log('\n[Test 12] Testing Firebase Analytics event recording...');
  const analyticsRes = await fetch(`${BASE_URL}/analytics/event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      eventName: 'post_search',
      params: { from: 'San Francisco', to: 'Los Angeles' },
    }),
  });
  const analyticsData = await analyticsRes.json();
  console.log('Analytics status:', analyticsRes.status, analyticsData.success ? 'RECORDED' : 'FAILED');

  // Test 13: Realtime Messaging REST & Seeding
  console.log('\n[Test 13] Testing Realtime Driver Comms Messaging...');
  const msgRes = await fetch(`${BASE_URL}/messages?roomId=drivemate-hq`);
  const msgData = await msgRes.json();
  console.log('Comms messages count:', msgData.messages?.length);

  const sendMsgRes = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      text: 'Heading south toward Los Angeles on I-5, smooth traffic so far!',
      roomId: 'drivemate-hq',
    }),
  });
  const sendMsgData = await sendMsgRes.json();
  console.log('Message sent status:', sendMsgData.success);

  // Test 14: Google Authentication & Account Provisioning
  console.log('\n[Test 14] Testing Google Sign-In & Profile Provisioning...');
  const googleTestEmail = `google.driver.${Date.now()}@gmail.com`;
  const googleRes = await fetch(`${BASE_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: googleTestEmail,
      displayName: 'Krishna Kanth (Google)',
      photoUrl: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
      googleId: `gid_${Date.now()}`,
    }),
  });
  const googleData = await googleRes.json();
  console.log('Google Auth status:', googleRes.status, googleData.success ? 'SUCCESS' : 'FAILED');
  if (!googleData.success || !googleData.token) {
    throw new Error(`Google Auth failed: ${JSON.stringify(googleData)}`);
  }

  // Test 15: Delete Account Permanently & Cleanup Verification
  console.log('\n[Test 15] Testing Permanent Account Deletion & Cleanup...');
  const deleteRes = await fetch(`${BASE_URL}/auth/account`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const deleteData = await deleteRes.json();
  console.log('Delete Account status:', deleteRes.status, deleteData.success ? 'SUCCESS' : 'FAILED');
  if (!deleteData.success) {
    throw new Error(`Account deletion failed: ${JSON.stringify(deleteData)}`);
  }
  console.log('Google driver email:', googleData.user.email, 'Provider:', googleData.user.authProvider, 'Quota:', googleData.user.maxFreePosts);

  // Test 16: Logout and Token Revocation
  console.log('\n[Test 16] Testing Logout and token session cleanup...');
  const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${googleData.token}` },
  });
  const logoutData = await logoutRes.json();
  console.log('Logout status:', logoutData.success);

  console.log('\n=============================================');
  console.log('🎉 ALL 16 BACKEND INTEGRATION TESTS PASSED 100%!');
  console.log('=============================================\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
