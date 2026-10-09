// '2026-10-09' → '2026.10.09'
export default function formatDate(date) {
  return date ? date.replaceAll('-', '.') : '';
}

// 사용자 기기 기준 오늘 날짜를 'YYYY-MM-DD'로.
export function today() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
