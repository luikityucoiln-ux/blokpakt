import { useQuery } from '@tanstack/react-query';
import PilotShell, { PilotAccess } from '../components/PilotShell';
import RequestList from '../components/RequestList';
import { useAuth } from '../hooks/use-auth';
import { isPilotAdmin, requestError } from '../lib/service-requests';

function OperatorRequests() {
  const { user } = useAuth();
  const access = useQuery({ queryKey: ['pilot-admin', user?.id], queryFn: isPilotAdmin, gcTime: 0, refetchInterval: 60_000 });
  if (access.isPending) return <p role="status">Checking operator permissions...</p>;
  if (access.error) return <div role="alert"><p>{requestError(access.error)}</p><button onClick={() => void access.refetch()} className="mt-3 font-bold text-primary">Retry access check</button></div>;
  if (!access.data) return <section className="rounded-2xl border border-border bg-card p-6"><h2 className="text-xl font-bold">Administrator access required</h2><p className="mt-2 text-sm">Signing in does not make you an administrator. The project owner must approve your verified account in Supabase.</p><button onClick={() => void access.refetch()} className="mt-4 text-sm font-bold text-primary">Check access again</button></section>;
  return <RequestList operator />;
}

export default function OperationsPage() {
  return <PilotShell title="Service request management"><PilotAccess><OperatorRequests /></PilotAccess></PilotShell>;
}
