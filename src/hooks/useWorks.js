import { useCallback, useEffect, useState } from 'react';
import { fetchAllWorks } from '../services/worksService.js';

export default function useWorks() {
  const [works, setWorks] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setWorks(await fetchAllWorks());
      setStatus('ready');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { works, status, reload: load };
}
