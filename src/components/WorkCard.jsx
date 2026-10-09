import { Link, useLocation } from 'react-router';
import formatDate from '../utils/formatDate.js';

// 카드 전체가 상세 페이지 링크다. 지금의 검색어, 필터를 넘겨서 "목록으로"가 그 상태로 돌아가게 한다.
export default function WorkCard({ work }) {
  const { search } = useLocation();
  return (
    <Link to={`/work/${work.id}`} state={{ listSearch: search }} className="work-card">
      <div className="work-card__thumb">
        <img src={work.thumbnailUrl} alt="" loading="lazy" />
      </div>
      <div className="work-card__body">
        <h2 className="work-card__title">{work.title}</h2>
        <p className="work-card__meta">
          <span className="work-card__category">{work.category}</span>
          <time dateTime={work.date}>{formatDate(work.date)}</time>
        </p>
      </div>
    </Link>
  );
}
