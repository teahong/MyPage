import { useEffect, useState } from 'react';
import { fetchCategories } from '../services/categoriesService.js';

// 카테고리 이름 목록. 불러오는 중에는 null, 실패하면 [] (화면은 카테고리 없이도 동작한다).
export default function useCategories() {
  const [categories, setCategories] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((names) => {
        if (!cancelled) setCategories(names);
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return categories;
}
