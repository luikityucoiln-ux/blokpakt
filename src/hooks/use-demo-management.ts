import { useEffect, useState } from 'react';
import { readDemoManagement, subscribeToDemoManagement, type DemoManagement } from '../lib/demo-management';

export function useDemoManagement() {
  const [data, setData] = useState<DemoManagement | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    function refresh() {
      try {
        setData(readDemoManagement());
        setError('');
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Could not load demo management data.');
      }
    }
    refresh();
    return subscribeToDemoManagement(refresh);
  }, []);
  return { data, error };
}
