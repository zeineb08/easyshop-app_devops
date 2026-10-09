import axios from 'axios';
import mongoose from 'mongoose';
import { generateToken } from '../src/lib/auth/utils';

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🧪 Starting Admin Dashboard Verification Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Generate Admin token
  const adminToken = await generateToken({
    userId: '6ac84fcf25d3d20ec4e04cbf',
    role: 'admin',
  });
  assert(!!adminToken, 'Generated admin JWT token');

  const adminHeaders = {
    headers: { Authorization: `Bearer ${adminToken}` },
  };

  // 2. Prepare / Register a normal user for non-admin & user management tests
  let normalUserToken = '';
  let normalUserId = '';
  const testUserEmail = `test_norm_${Date.now()}@example.com`;
  const testUserPassword = 'testUserPassword123';

  try {
    const regRes = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Test Candidate User',
      email: testUserEmail,
      password: testUserPassword,
    });
    normalUserToken = regRes.data.token;
    normalUserId = regRes.data.user.id || regRes.data.user._id;
    assert(!!normalUserToken && !!normalUserId, 'Registered test normal user via API');
  } catch (err: any) {
    assert(false, `User registration failed: ${err.response?.data?.error || err.message}`);
    process.exit(1);
  }

  const userHeaders = {
    headers: { Authorization: `Bearer ${normalUserToken}` },
  };

  // ─── Test Group 1: Access Control (Server-side Enforcement) ───
  console.log('\n--- Test Group 1: Access Control on Admin Routes ---');

  // 1.1 Unauthenticated requests rejected (401)
  try {
    await axios.get(`${BASE_URL}/api/admin/users`);
    assert(false, 'Unauthenticated GET /api/admin/users should be rejected');
  } catch (err: any) {
    assert(err.response?.status === 401, 'Unauthenticated GET /api/admin/users rejected with 401');
  }

  try {
    await axios.get(`${BASE_URL}/api/admin/shops`);
    assert(false, 'Unauthenticated GET /api/admin/shops should be rejected');
  } catch (err: any) {
    assert(err.response?.status === 401, 'Unauthenticated GET /api/admin/shops rejected with 401');
  }

  try {
    await axios.get(`${BASE_URL}/api/admin/categories`);
    assert(false, 'Unauthenticated GET /api/admin/categories should be rejected');
  } catch (err: any) {
    assert(err.response?.status === 401, 'Unauthenticated GET /api/admin/categories rejected with 401');
  }

  // 1.2 Non-admin requests rejected (403)
  try {
    await axios.get(`${BASE_URL}/api/admin/users`, userHeaders);
    assert(false, 'Non-admin GET /api/admin/users should be rejected');
  } catch (err: any) {
    assert(err.response?.status === 403, 'Non-admin GET /api/admin/users rejected with 403');
  }

  try {
    await axios.get(`${BASE_URL}/api/admin/shops`, userHeaders);
    assert(false, 'Non-admin GET /api/admin/shops should be rejected');
  } catch (err: any) {
    assert(err.response?.status === 403, 'Non-admin GET /api/admin/shops rejected with 403');
  }

  try {
    await axios.get(`${BASE_URL}/api/admin/categories`, userHeaders);
    assert(false, 'Non-admin GET /api/admin/categories should be rejected');
  } catch (err: any) {
    assert(err.response?.status === 403, 'Non-admin GET /api/admin/categories rejected with 403');
  }

  // 1.3 Admin requests allowed (200)
  try {
    const resUsers = await axios.get(`${BASE_URL}/api/admin/users`, adminHeaders);
    assert(resUsers.status === 200 && Array.isArray(resUsers.data.users), 'Admin GET /api/admin/users returns 200 and list');
  } catch (err: any) {
    assert(false, `Admin GET /api/admin/users failed: ${err.message}`);
  }

  try {
    const resShops = await axios.get(`${BASE_URL}/api/admin/shops`, adminHeaders);
    assert(resShops.status === 200 && Array.isArray(resShops.data.shops), 'Admin GET /api/admin/shops returns 200 and list');
  } catch (err: any) {
    assert(false, `Admin GET /api/admin/shops failed: ${err.message}`);
  }

  // ─── Test Group 2: Shop Management (CRUD) ───
  console.log('\n--- Test Group 2: Shop Management CRUD Flow ---');
  const testShopSlug = `test-shop-${Date.now()}`;

  // 2.1 Create Shop
  let createdShop: any;
  try {
    const res = await axios.post(
      `${BASE_URL}/api/admin/shops`,
      {
        slug: testShopSlug,
        title: 'Test Integration Shop',
        icon: '/icons/demo.png',
        order: 99,
      },
      adminHeaders
    );
    createdShop = res.data.shop;
    assert(res.status === 201 && createdShop.title === 'Test Integration Shop', 'POST /api/admin/shops creates shop');
  } catch (err: any) {
    assert(false, `POST /api/admin/shops failed: ${err.response?.data?.error || err.message}`);
  }

  // 2.2 Get Shop by Slug
  try {
    const res = await axios.get(`${BASE_URL}/api/admin/shops/${testShopSlug}`, adminHeaders);
    assert(res.status === 200 && res.data.shop.slug === testShopSlug, 'GET /api/admin/shops/[slug] retrieves shop');
  } catch (err: any) {
    assert(false, `GET /api/admin/shops/[slug] failed: ${err.message}`);
  }

  // 2.3 Update Shop
  try {
    const res = await axios.patch(
      `${BASE_URL}/api/admin/shops/${testShopSlug}`,
      { title: 'Updated Integration Shop', order: 100 },
      adminHeaders
    );
    assert(res.status === 200 && res.data.shop.title === 'Updated Integration Shop', 'PATCH /api/admin/shops/[slug] updates shop title');
  } catch (err: any) {
    assert(false, `PATCH /api/admin/shops/[slug] failed: ${err.message}`);
  }

  // ─── Test Group 3: Category Management & Nested Hierarchy ───
  console.log('\n--- Test Group 3: Category CRUD & Nested Hierarchy Flow ---');
  let parentCat: any;
  let childCat: any;

  // 3.1 Create Parent Category
  try {
    const res = await axios.post(
      `${BASE_URL}/api/admin/categories`,
      {
        shopSlug: testShopSlug,
        name: 'Top Category',
        slug: 'top-cat',
        order: 1,
      },
      adminHeaders
    );
    parentCat = res.data.category;
    assert(res.status === 201 && parentCat.name === 'Top Category', 'POST /api/admin/categories creates top-level category');
  } catch (err: any) {
    assert(false, `POST /api/admin/categories failed: ${err.response?.data?.error || err.message}`);
  }

  // 3.2 Create Nested Child Category
  try {
    const res = await axios.post(
      `${BASE_URL}/api/admin/categories`,
      {
        shopSlug: testShopSlug,
        name: 'Sub Category',
        slug: 'sub-cat',
        parent: parentCat._id,
        order: 1,
      },
      adminHeaders
    );
    childCat = res.data.category;
    assert(
      res.status === 201 && childCat.parent === parentCat._id,
      'POST /api/admin/categories creates nested child category with parent reference'
    );
  } catch (err: any) {
    assert(false, `POST child category failed: ${err.response?.data?.error || err.message}`);
  }

  // 3.3 Update Category (rename)
  try {
    const res = await axios.patch(
      `${BASE_URL}/api/admin/categories/${childCat._id}`,
      { name: 'Renamed Sub Category' },
      adminHeaders
    );
    assert(res.status === 200 && res.data.category.name === 'Renamed Sub Category', 'PATCH /api/admin/categories/[id] renames category');
  } catch (err: any) {
    assert(false, `PATCH category failed: ${err.message}`);
  }

  // 3.4 Delete Category (cascading children)
  try {
    const res = await axios.delete(`${BASE_URL}/api/admin/categories/${parentCat._id}`, adminHeaders);
    assert(res.status === 200 && res.data.success === true, 'DELETE /api/admin/categories/[id] deletes parent category');

    // Confirm child was cascade deleted
    const checkCats = await axios.get(`${BASE_URL}/api/admin/categories?shopSlug=${testShopSlug}`, adminHeaders);
    const hasChild = checkCats.data.categories.some((c: any) => c._id === childCat._id);
    assert(!hasChild, 'Deleting parent category cascades and removes child category');
  } catch (err: any) {
    assert(false, `DELETE category failed: ${err.message}`);
  }

  // 2.4 Delete Shop (and cascade categories)
  try {
    const res = await axios.delete(`${BASE_URL}/api/admin/shops/${testShopSlug}`, adminHeaders);
    assert(res.status === 200 && res.data.success === true, 'DELETE /api/admin/shops/[slug] deletes shop');
  } catch (err: any) {
    assert(false, `DELETE shop failed: ${err.message}`);
  }

  // ─── Test Group 4: User Management (View, Search, Edit, Soft-Deactivate) ───
  console.log('\n--- Test Group 4: User Management Flow ---');

  // 4.1 Search users
  try {
    const res = await axios.get(`${BASE_URL}/api/admin/users?q=Candidate`, adminHeaders);
    const found = res.data.users.some((u: any) => u.email === testUserEmail);
    assert(res.status === 200 && found, 'GET /api/admin/users?q=Candidate returns matching user in search');
  } catch (err: any) {
    assert(false, `GET users with query failed: ${err.message}`);
  }

  // 4.2 Edit user account
  try {
    const res = await axios.patch(
      `${BASE_URL}/api/admin/users/${normalUserId}`,
      { name: 'Updated Candidate User' },
      adminHeaders
    );
    assert(
      res.status === 200 && res.data.user.name === 'Updated Candidate User',
      'PATCH /api/admin/users/[id] updates user name'
    );
  } catch (err: any) {
    assert(false, `PATCH user failed: ${err.response?.data?.error || err.message}`);
  }

  // 4.3 Soft-deactivate user
  try {
    const res = await axios.patch(
      `${BASE_URL}/api/admin/users/${normalUserId}`,
      { isActive: false },
      adminHeaders
    );
    assert(
      res.status === 200 && res.data.user.isActive === false,
      'PATCH /api/admin/users/[id] soft-deactivates user (isActive: false)'
    );
  } catch (err: any) {
    assert(false, `PATCH user deactivate failed: ${err.message}`);
  }

  // 4.4 Deactivated user cannot log in
  try {
    await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testUserEmail,
      password: testUserPassword,
    });
    assert(false, 'Deactivated user should NOT be able to log in');
  } catch (err: any) {
    assert(err.response?.status === 403, 'Login attempt with deactivated account rejected with 403');
  }

  // 4.5 Reactivate user
  try {
    const res = await axios.patch(
      `${BASE_URL}/api/admin/users/${normalUserId}`,
      { isActive: true },
      adminHeaders
    );
    assert(
      res.status === 200 && res.data.user.isActive === true,
      'PATCH /api/admin/users/[id] reactivates user (isActive: true)'
    );
  } catch (err: any) {
    assert(false, `PATCH user reactivate failed: ${err.message}`);
  }

  // 4.6 Reactivated user can now log in
  try {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testUserEmail,
      password: testUserPassword,
    });
    assert(res.status === 200 && res.data.success === true, 'Reactivated user successfully logs in (200)');
  } catch (err: any) {
    assert(false, `Login with reactivated account failed: ${err.message}`);
  }

  // Cleanup: connect directly to remove test user
  try {
    await mongoose.connect('mongodb://localhost:27017/easyshop');
    await mongoose.connection.collection('users').deleteOne({ email: testUserEmail });
    await mongoose.disconnect();
  } catch {
    // optional cleanup
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
