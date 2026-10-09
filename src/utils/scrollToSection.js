// 섹션으로 이동하고 키보드 초점도 옮긴다. 움직임 줄이기를 켠 사용자에게는 바로 이동한다.
export default function scrollToSection(id, { smooth = true } = {}) {
  const element = document.getElementById(id);
  if (!element) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  element.scrollIntoView({ behavior: smooth && !reduceMotion ? 'smooth' : 'auto', block: 'start' });
  element.focus({ preventScroll: true });
}
