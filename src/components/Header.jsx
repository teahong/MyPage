import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import characterUrl from '../image/profile.png';
import useAuth from '../hooks/useAuth.js';
import { signOut } from '../services/authService.js';
import PinDialog from './PinDialog.jsx';

export const GREETING = '안녕하세요, 뽀글쌤입니다.';

// 헤더 버튼 앞의 작은 선 아이콘. 글자색을 따라간다.
const ICON_PATHS = {
  add: 'M12 5v14M5 12h14',
  categories: 'M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 8l-4 4 4 4M6 12h10',
  login: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
};

function Icon({ name }) {
  return (
    <svg className="header-action__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

export default function Header() {
  const { isAdmin, ready } = useAuth();
  const [pinOpen, setPinOpen] = useState(false);

  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="header__intro">
          <span className="header__avatar">
            <img src={characterUrl} alt="뽀글쌤 캐릭터" />
          </span>
          <p className="header__greeting">{GREETING}</p>
        </Link>
        {/* 오른쪽 버튼은 모두 같은 둥근 모양. "추가"만 포인트 컬러로 채우고, 지금 열린 화면의 버튼은 옅게 채운다. */}
        <div className="header__actions">
          {ready && isAdmin && (
            <>
              <NavLink to="/admin/new" className="header-action header-action--primary">
                <Icon name="add" />
                추가
              </NavLink>
              <NavLink to="/admin/categories" className="header-action">
                <Icon name="categories" />
                카테고리
              </NavLink>
              <button type="button" className="header-action" onClick={signOut}>
                <Icon name="logout" />
                로그아웃
              </button>
            </>
          )}
          {ready && !isAdmin && (
            <button type="button" className="header-action" onClick={() => setPinOpen(true)}>
              <Icon name="login" />
              관리자 로그인
            </button>
          )}
        </div>
      </div>
      {pinOpen && <PinDialog onClose={() => setPinOpen(false)} />}
    </header>
  );
}
