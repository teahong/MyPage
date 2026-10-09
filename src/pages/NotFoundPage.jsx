import { Link } from 'react-router';
import CharacterMessage from '../components/CharacterMessage.jsx';

export default function NotFoundPage() {
  return (
    <main className="container page">
      <CharacterMessage message="페이지를 찾을 수 없어요">
        <Link to="/" className="button">
          목록으로
        </Link>
      </CharacterMessage>
    </main>
  );
}
