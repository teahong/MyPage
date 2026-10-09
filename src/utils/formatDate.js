// '2026-10-09' → '2026.10.09'
export default function formatDate(date) {
  return date ? date.replaceAll('-', '.') : '';
}
