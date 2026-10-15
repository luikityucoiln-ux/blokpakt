import PilotShell, { PilotAccess } from '../components/PilotShell';
import RequestList from '../components/RequestList';

export default function RequestsPage() {
  return <PilotShell title="My service requests"><PilotAccess><RequestList /></PilotAccess></PilotShell>;
}
