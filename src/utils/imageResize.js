const MAX_SIDE = 1600;
const WEBP_QUALITY = 0.9;

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('이미지 변환 실패'))), type, quality);
  });
}

// 긴 변을 1600px 이하로 줄인다. png는 투명 배경을 살리려고 png로, 그 외는 webp로 저장한다.
// png가 이미 1600px 이하면 원본을 그대로 쓴다.
export default async function resizeImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const isPng = file.type === 'image/png';

  if (isPng && scale === 1) {
    bitmap.close();
    return { blob: file, type: 'image/png', ext: 'png' };
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext('2d');
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const type = isPng ? 'image/png' : 'image/webp';
  const blob = await canvasToBlob(canvas, type, isPng ? undefined : WEBP_QUALITY);
  return { blob, type, ext: isPng ? 'png' : 'webp' };
}
