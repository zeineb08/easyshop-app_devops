const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const modelsDir = path.join(srcDir, 'lib', 'models');
const apiAdminDir = path.join(srcDir, 'app', 'api', 'admin');
const adminDir = path.join(srcDir, 'app', 'admin');

function mkdir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

mkdir(modelsDir);
mkdir(apiAdminDir);
mkdir(adminDir);

// 1. Models
fs.writeFileSync(path.join(modelsDir, 'shop.ts'), `
import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
  title: { type: String, required: true },
  icon: { type: String, required: true },
  url: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.Shop || mongoose.model('Shop', shopSchema);
`);

fs.writeFileSync(path.join(modelsDir, 'category.ts'), `
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  icon: { type: String },
  shop_category: { type: String, required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }
}, { timestamps: true });

export default mongoose.models.Category || mongoose.model('Category', categorySchema);
`);

// 2. User update
const userModelPath = path.join(modelsDir, 'user.ts');
let userModelCode = fs.readFileSync(userModelPath, 'utf-8');
if (!userModelCode.includes('isActive')) {
  userModelCode = userModelCode.replace('role: {', 'isActive: { type: Boolean, default: true },\n  role: {');
  fs.writeFileSync(userModelPath, userModelCode);
}

// 3. Admin routes (Users)
mkdir(path.join(apiAdminDir, 'users'));
fs.writeFileSync(path.join(apiAdminDir, 'users', 'route.ts'), `
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/user';

export async function GET() {
  await connectDB();
  const users = await User.find().select('-password');
  return NextResponse.json({ users });
}
`);

mkdir(path.join(apiAdminDir, 'users', '[id]'));
fs.writeFileSync(path.join(apiAdminDir, 'users', '[id]', 'route.ts'), `
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/models/user';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const body = await req.json();
  const user = await User.findByIdAndUpdate(params.id, body, { new: true });
  return NextResponse.json({ user });
}
`);

// 4. Admin UI Basic setup
fs.writeFileSync(path.join(adminDir, 'layout.tsx'), `
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white p-4 shadow">
        <h1 className="text-xl font-bold mb-4">Admin Dashboard</h1>
        <nav className="space-y-2">
          <a href="/admin/users" className="block text-blue-600">Users</a>
          <a href="/admin/shops" className="block text-blue-600">Shops & Categories</a>
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
`);

fs.writeFileSync(path.join(adminDir, 'page.tsx'), `
import { redirect } from 'next/navigation';
export default function AdminPage() {
  redirect('/admin/users');
}
`);

mkdir(path.join(adminDir, 'users'));
fs.writeFileSync(path.join(adminDir, 'users', 'page.tsx'), `
"use client";
import { useEffect, useState } from 'react';

export default function UsersAdmin() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => setUsers(d.users));
  }, []);

  const toggleStatus = async (id: string, current: boolean) => {
    await fetch(\`/api/admin/users/\${id}\`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !current })
    });
    setUsers(users.map(u => u._id === id ? { ...u, isActive: !current } : u));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Manage Users</h2>
      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr className="border-b"><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Role</th><th className="p-2">Status</th><th className="p-2">Action</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id} className="border-b text-center">
              <td className="p-2">{u.name}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2">{u.role}</td>
              <td className="p-2">{u.isActive ? 'Active' : 'Inactive'}</td>
              <td className="p-2">
                <button onClick={() => toggleStatus(u._id, u.isActive)} className="text-blue-500">Toggle Status</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
`);

console.log('Scaffold complete');
