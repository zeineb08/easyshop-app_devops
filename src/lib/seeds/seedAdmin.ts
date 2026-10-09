import dbConnect from '../db';
import User from '../models/user';

async function seedAdmin() {
  await dbConnect();

  // Promote existing user to admin if present
  const existingUser = await User.findOne({ email: 'sioudzeineb08@gmail.com' });
  if (existingUser) {
    existingUser.role = 'admin';
    existingUser.isActive = true;
    await existingUser.save();
    console.log('✅ Promoted sioudzeineb08@gmail.com to admin');
  }

  const firstUser = await User.findOne({ email: 'zeineb@gmail.com' });
  if (firstUser) {
    firstUser.role = 'admin';
    firstUser.isActive = true;
    await firstUser.save();
    console.log('✅ Promoted zeineb@gmail.com to admin');
  }

  // Also ensure a standard admin account exists: admin@easyshop.com / admin123456
  const adminAccount = await User.findOne({ email: 'admin@easyshop.com' });
  if (!adminAccount) {
    await User.create({
      name: 'System Administrator',
      email: 'admin@easyshop.com',
      password: 'adminPassword123',
      role: 'admin',
      isActive: true,
    });
    console.log('✅ Created default admin account: admin@easyshop.com');
  } else {
    adminAccount.role = 'admin';
    adminAccount.isActive = true;
    adminAccount.password = 'adminPassword123';
    await adminAccount.save();
    console.log('✅ Reset admin@easyshop.com password to adminPassword123');
  }

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('❌ Error seeding admin:', err);
  process.exit(1);
});
