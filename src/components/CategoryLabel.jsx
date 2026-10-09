import categoryTone from '../utils/categoryTone.js';

export default function CategoryLabel({ name, categories }) {
  return <span className={`category-label tone-${categoryTone(name, categories)}`}>{name}</span>;
}
