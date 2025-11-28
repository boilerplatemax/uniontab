import { DashboardAuthWrapper } from './dashboard-auth-wrapper';
import DashboardContent from './dashboard-content';

export default async function DashboardPage() {
  return (
    <DashboardAuthWrapper>
      <DashboardContent />
    </DashboardAuthWrapper>
  );
}
