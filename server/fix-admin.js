require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const col = mongoose.connection.collection('users');

  // Check if admin exists (created by seedAdmin script with raw hash)
  let admin = await col.findOne({ email: 'admin@lumina.com' });
  const hash = await bcrypt.hash('Admin123!', 12);

  if (!admin) {
    await col.insertOne({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@lumina.com',
      password: hash,
      role: 'admin',
      isEmailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('Admin created!');
  } else {
    await col.updateOne(
      { email: 'admin@lumina.com' },
      { $set: { password: hash, role: 'admin', isEmailVerified: true } }
    );
    console.log('Admin password reset!');
  }

  admin = await col.findOne({ email: 'admin@lumina.com' });
  console.log('Admin role:', admin.role, '| email:', admin.email);
  const test = await bcrypt.compare('Admin123!', admin.password);
  console.log('Password verify test:', test);
  mongoose.disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
