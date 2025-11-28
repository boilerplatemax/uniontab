import { DashboardAuthWrapper } from '../dashboard-auth-wrapper';
import SecurityContent from './security-content';

export default async function SecurityPage() {
  return (
    <DashboardAuthWrapper>
      <SecurityContent />
    </DashboardAuthWrapper>
  );
}
