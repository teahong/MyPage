import { useEffect, useRef, useState } from 'react';

const DEBOUNCE_MS = 300;

// 입력을 멈추고 300ms 뒤에 onSearch를 부른다. 지우기 버튼은 바로 부른다.
export default function SearchBar({ initialQuery, onSearch }) {
  const [value, setValue] = useState(initialQuery);
  const inputRef = useRef(null);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;
  const skipFirst = useRef(true);

  useEffect(() => {
    // 처음 그릴 때는 주소에 있던 검색어 그대로라 다시 반영할 필요가 없다.
    if (skipFirst.current) {
      skipFirst.current = false;
      return undefined;
    }
    const timer = setTimeout(() => onSearchRef.current(value), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  function handleClear() {
    setValue('');
    onSearchRef.current('');
    inputRef.current.focus();
  }

  return (
    <form className="search-bar" role="search" onSubmit={(event) => event.preventDefault()}>
      <label className="visually-hidden" htmlFor="work-search">
        작업물 검색
      </label>
      <input
        ref={inputRef}
        id="work-search"
        className="search-bar__input"
        type="search"
        placeholder="제목이나 설명으로 찾아보세요"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        autoComplete="off"
        enterKeyHint="search"
      />
      {value && (
        <button type="button" className="text-button search-bar__clear" onClick={handleClear}>
          지우기
        </button>
      )}
    </form>
  );
}
