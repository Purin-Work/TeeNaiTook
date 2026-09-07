import { AdminShell } from '@/components/admin/admin-shell';
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
