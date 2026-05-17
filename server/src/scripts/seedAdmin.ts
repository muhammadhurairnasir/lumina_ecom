import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';

const seed = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
  console.log('Connecting to:', uri);
  await mongoose.connect(uri);
  console.log('Connected!');

  const existing = await User.findOne({ email: 'admin@lumina.com' });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const admin = await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@lumina.com',
    password: passwordHash,
    role: 'admin',
    isEmailVerified: true,
  });

  console.log('✅ Admin user created:', admin.email);
  console.log('   Email:    admin@lumina.com');
  console.log('   Password: Admin123!');

  await mongoose.disconnect();
};

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
