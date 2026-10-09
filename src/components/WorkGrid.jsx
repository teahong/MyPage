import WorkCard from './WorkCard.jsx';

export default function WorkGrid({ works }) {
  return (
    <ul className="work-grid">
      {works.map((work) => (
        <li key={work.id}>
          <WorkCard work={work} />
        </li>
      ))}
    </ul>
  );
}
