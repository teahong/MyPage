import { useEffect } from 'react';

export const SITE_NAME = '뽀글쌤';

// title이 없으면 사이트 이름만 쓴다.
export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  }, [title]);
}
