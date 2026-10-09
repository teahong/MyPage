// 경력 목록. 기간은 왼쪽, 내용은 오른쪽 (좁은 화면에서는 위아래).
export default function ExperienceList({ items }) {
  return (
    <ol className="experience-list">
      {items.map((item) => (
        <li key={`${item.period}-${item.organization}-${item.role}`} className="experience">
          <p className="experience__period">{item.period}</p>
          <div className="experience__body">
            <h3 className="experience__title">
              {item.role}
              {item.organization && <span className="experience__org"> · {item.organization}</span>}
            </h3>
            {item.description && <p className="experience__description">{item.description}</p>}
            {item.tags?.length > 0 && (
              <ul className="experience__tags">
                {item.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
