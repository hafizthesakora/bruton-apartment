import Sidebar from './_components/Sidebar';
import { StaffProvider } from './_components/StaffContext';

export const metadata = {
  title: 'Admin — Bruton Gardens',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return (
    <StaffProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </StaffProvider>
  );
}
