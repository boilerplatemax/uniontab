import { DashboardAuthWrapper } from '../dashboard-auth-wrapper';
import GeneralContent from './general-content';

export default async function GeneralPage() {
  return (
    <DashboardAuthWrapper>
      <GeneralContent />
    </DashboardAuthWrapper>
  );
}
