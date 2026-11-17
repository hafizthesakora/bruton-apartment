import Sidebar from './_components/Sidebar';
import { StaffProvider } from './_components/StaffContext';

export const metadata = {
  title: 'Admin — Bruton Gardens',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return (
    <StaffProvider>
      <div className="flex min-h-screen flex-col bg-gray-50 lg:flex-row">
        <Sidebar />
        <main className="min-w-0 w-full flex-1 overflow-auto">{children}</main>
      </div>
    </StaffProvider>
  );
}
