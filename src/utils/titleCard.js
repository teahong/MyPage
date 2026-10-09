// 썸네일이 없을 때 쓰는 제목 카드. 사이트 색 위에 카테고리와 제목을 크게 쓴다.
// 색은 tokens.css의 --cover-* 변수에서 읽는다. 제목에 따라 같은 조합이 나오도록 고른다.

const WIDTH = 1600;
const HEIGHT = 1000;
const PADDING = 120;
const TITLE_SIZE = 112;
const TITLE_LINE_HEIGHT = 1.3;
const TITLE_MAX_LINES = 3;
const CATEGORY_SIZE = 52;
const COVER_COUNT = 3;

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function hash(text) {
  let value = 0;
  for (const char of text) value = (value * 31 + char.codePointAt(0)) >>> 0;
  return value;
}

// 띄어쓰기 단위로 줄을 바꾼다. 한 단어가 한 줄보다 길 때만 글자 단위로 자른다.
// 넘치면 마지막 줄을 말줄임한다.
function wrapLines(context, text, maxWidth, maxLines) {
  const fits = (value) => context.measureText(value).width <= maxWidth;
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (fits(candidate)) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = '';
    for (const char of word) {
      if (line && !fits(line + char)) {
        lines.push(line);
        line = '';
      }
      line += char;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;

  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last && context.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
  kept[maxLines - 1] = `${last.trimEnd()}…`;
  return kept;
}

export default async function createTitleCard({ title, category }) {
  const fontFamily = cssVar('--font-family');
  await Promise.all([
    document.fonts.load(`700 ${TITLE_SIZE}px ${fontFamily}`, title),
    document.fonts.load(`600 ${CATEGORY_SIZE}px ${fontFamily}`, category),
  ]).catch(() => {});

  const cover = (hash(title) % COVER_COUNT) + 1;
  const background = cssVar(`--cover-${cover}-bg`);
  const foreground = cssVar(`--cover-${cover}-text`);

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext('2d');

  context.fillStyle = background;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = foreground;
  context.textBaseline = 'top';

  context.font = `700 ${TITLE_SIZE}px ${fontFamily}`;
  const lines = wrapLines(context, title, WIDTH - PADDING * 2, TITLE_MAX_LINES);
  const lineHeight = TITLE_SIZE * TITLE_LINE_HEIGHT;
  const blockHeight = CATEGORY_SIZE * 1.6 + lines.length * lineHeight;
  let y = (HEIGHT - blockHeight) / 2;

  context.font = `600 ${CATEGORY_SIZE}px ${fontFamily}`;
  context.globalAlpha = 0.75;
  context.fillText(category, PADDING, y);
  context.globalAlpha = 1;
  y += CATEGORY_SIZE * 1.6;

  context.font = `700 ${TITLE_SIZE}px ${fontFamily}`;
  for (const line of lines) {
    context.fillText(line, PADDING, y);
    y += lineHeight;
  }

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('제목 카드 생성 실패'))), 'image/png');
  });
  return new File([blob], 'title-card.png', { type: 'image/png' });
}
