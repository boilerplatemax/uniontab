import { redirect } from 'next/navigation';
import { getUser } from '@/lib/db/queries';
import { AdminNavbar } from '@/components/admin-navbar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  // Check if user is authenticated and is a webmaster
  if (!user || user.role !== 'webmaster') {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar userName={user.name} />
      {children}
    </div>
  );
}
