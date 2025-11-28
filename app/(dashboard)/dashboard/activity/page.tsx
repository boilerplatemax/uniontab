import { DashboardAuthWrapper } from '../dashboard-auth-wrapper';
import ActivityContent from './activity-content';

export default async function ActivityPage() {
  return (
    <DashboardAuthWrapper>
      <ActivityContent />
    </DashboardAuthWrapper>
  );
}
