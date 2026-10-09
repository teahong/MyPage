import { useEffect } from 'react';
import { useLocation } from 'react-router';

// 다른 페이지로 이동하면 맨 위에서 시작한다. 같은 페이지에서 필터만 바뀔 때는 그대로 둔다.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
