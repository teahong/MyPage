import formatDate from '../utils/formatDate.js';

// 상세 페이지 링크(/work/:id)는 라우터를 붙이는 10단계에서 연결한다.
export default function WorkCard({ work }) {
  return (
    <article className="work-card">
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
    </article>
  );
}
