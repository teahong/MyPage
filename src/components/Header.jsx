import { useState } from 'react';
import { Link } from 'react-router';
import characterUrl from '../assets/character.svg';
import useAuth from '../hooks/useAuth.js';
import { signOut } from '../services/authService.js';
import PinDialog from './PinDialog.jsx';

export const GREETING = '안녕하세요, 제 작업물을 모아뒀어요';

export default function Header() {
  const { isAdmin, ready } = useAuth();
  const [pinOpen, setPinOpen] = useState(false);

  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="header__intro">
          <img className="header__character" src={characterUrl} alt="작업물 아카이브 캐릭터" />
          <p className="header__greeting">{GREETING}</p>
        </Link>
        <div className="header__actions">
          {ready && isAdmin && (
            <>
              <Link to="/admin/new" className="button button--primary">
                추가
              </Link>
              <button type="button" className="text-button" onClick={signOut}>
                로그아웃
              </button>
            </>
          )}
          {ready && !isAdmin && (
            <button type="button" className="text-button" onClick={() => setPinOpen(true)}>
              관리자 로그인
            </button>
          )}
        </div>
      </div>
      {pinOpen && <PinDialog onClose={() => setPinOpen(false)} />}
    </header>
  );
}
