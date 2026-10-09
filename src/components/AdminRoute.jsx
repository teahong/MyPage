import { Navigate } from 'react-router';
import useAuth from '../hooks/useAuth.js';
import CharacterMessage from './CharacterMessage.jsx';

// 관리자가 아니면 목록으로 돌려보낸다. 화면 접근만 막고, 실제 쓰기 권한은 DB의 RLS가 막는다.
export default function AdminRoute({ children }) {
  const { isAdmin, ready } = useAuth();

  if (!ready) {
    return (
      <main className="container page">
        <CharacterMessage message="불러오는 중" role="status" />
      </main>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
