// 추가, 수정, 삭제 화면이 같이 쓰는 저장 순서.
// 실패하면 화면 문구를 고를 수 있도록 code를 붙여 던진다:
// category_duplicate | category | thumbnail | save | delete
import resizeImage from '../utils/imageResize.js';
import createTitleCard from '../utils/titleCard.js';
import { NEW_CATEGORY } from '../utils/validators.js';
import { createCategory } from './categoriesService.js';
import { fetchLinkImage } from './linkImageService.js';
import { deleteThumbnail, uploadThumbnail } from './storageService.js';
import { createWork, deleteWork, updateWork } from './worksService.js';

function fail(code, cause) {
  console.error(cause);
  return Object.assign(new Error(code), { code, cause });
}

// "새 카테고리 추가"를 골랐으면 카테고리를 먼저 만들고, 그 이름을 category에 넣은 값을 돌려준다.
async function resolveCategory(values) {
  if (values.category !== NEW_CATEGORY) return values;
  const name = values.newCategory.trim();
  try {
    await createCategory(name);
  } catch (error) {
    throw fail(error.code === 'duplicate' ? 'category_duplicate' : 'category', error);
  }
  return { ...values, category: name };
}

// 고른 이미지 → 링크의 대표 이미지 → 제목 카드 순서로 정하고 업로드할 크기로 줄인다.
// 링크 이미지는 찾지 못하거나 브라우저가 열지 못하면 건너뛴다.
async function prepareThumbnail(values, pickedFile) {
  if (pickedFile) return resizeImage(pickedFile);
  const linkImage = await fetchLinkImage(values.linkUrl);
  if (linkImage) {
    try {
      return await resizeImage(linkImage);
    } catch (error) {
      console.error(error);
    }
  }
  return resizeImage(await createTitleCard({ title: values.title.trim(), category: values.category }));
}

function removeQuietly(path) {
  deleteThumbnail(path).catch((error) => console.error(error));
}

// 새 작업물. 행 저장이 실패하면 방금 올린 썸네일을 지운다. 새 작업물의 id를 돌려준다.
export async function saveNewWork(formValues, pickedFile) {
  const values = await resolveCategory(formValues);
  const id = crypto.randomUUID();

  let thumbnail;
  try {
    thumbnail = await uploadThumbnail(id, await prepareThumbnail(values, pickedFile));
  } catch (error) {
    throw fail('thumbnail', error);
  }

  try {
    await createWork(id, values, thumbnail);
  } catch (error) {
    removeQuietly(thumbnail.path);
    throw fail('save', error);
  }
  return id;
}

// 수정. 썸네일은 새로 고른 경우에만 바꾼다.
// 새 썸네일 업로드와 행 갱신이 모두 성공한 뒤에 기존 썸네일을 지운다 (실패하면 콘솔에만 남김).
export async function saveWorkEdits(work, formValues, pickedFile) {
  const values = await resolveCategory(formValues);

  let thumbnail = null;
  if (pickedFile) {
    try {
      thumbnail = await uploadThumbnail(work.id, await resizeImage(pickedFile));
    } catch (error) {
      throw fail('thumbnail', error);
    }
  }

  try {
    await updateWork(work.id, values, thumbnail);
  } catch (error) {
    if (thumbnail) removeQuietly(thumbnail.path);
    throw fail('save', error);
  }

  if (thumbnail && work.thumbnailPath) removeQuietly(work.thumbnailPath);
}

// 삭제. 행을 먼저 지우고 썸네일을 지운다. 썸네일 삭제만 실패하면 콘솔에만 남긴다.
export async function removeWork(work) {
  try {
    await deleteWork(work.id);
  } catch (error) {
    throw fail('delete', error);
  }
  if (work.thumbnailPath) removeQuietly(work.thumbnailPath);
}

export const SAVE_ERROR_MESSAGES = {
  category_duplicate: '이미 있는 카테고리예요. 목록에서 골라 주세요',
  category: '카테고리를 저장하지 못했어요. 다시 시도해 주세요',
  thumbnail: '썸네일을 올리지 못했어요. 다시 시도해 주세요',
  save: '저장하지 못했어요. 다시 시도해 주세요',
  delete: '삭제하지 못했어요. 다시 시도해 주세요',
};
