import { Link } from 'react-router';
import CharacterMessage from '../components/CharacterMessage.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

export default function NotFoundPage() {
  useDocumentTitle('페이지를 찾을 수 없어요');
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
