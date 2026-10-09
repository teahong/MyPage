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

  // 화면을 "불러오는 중"으로 바꾸지 않고 목록만 새로 받는다 (순서 저장 뒤). 실패하면 던진다.
  const refresh = useCallback(async () => {
    setWorks(await fetchAllWorks());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { works, status, reload: load, refresh };
}
