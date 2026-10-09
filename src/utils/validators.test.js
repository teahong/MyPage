import { describe, expect, it } from 'vitest';
import {
  NEW_CATEGORY,
  validateCategory,
  validateCategoryName,
  validateDate,
  validateDescription,
  validateLinkUrl,
  validateThumbnail,
  validateTitle,
  validateWork,
} from './validators.js';

const file = (type, size = 1000) => ({ type, size });

describe('validateTitle', () => {
  it('앞뒤 공백을 빼고 1~60자만 허용한다', () => {
    expect(validateTitle('')).not.toBe('');
    expect(validateTitle('   ')).not.toBe('');
    expect(validateTitle('가')).toBe('');
    expect(validateTitle('가'.repeat(60))).toBe('');
    expect(validateTitle(`  ${'가'.repeat(60)}  `)).toBe('');
    expect(validateTitle('가'.repeat(61))).not.toBe('');
  });
});

describe('validateDescription', () => {
  it('1~2000자, 줄바꿈을 허용한다', () => {
    expect(validateDescription('\n \n')).not.toBe('');
    expect(validateDescription('첫 줄\n둘째 줄')).toBe('');
    expect(validateDescription('a'.repeat(2000))).toBe('');
    expect(validateDescription('a'.repeat(2001))).not.toBe('');
  });
});

describe('validateCategory', () => {
  it('비어 있으면 막는다', () => {
    expect(validateCategory('')).not.toBe('');
    expect(validateCategory('앱')).toBe('');
  });
});

describe('validateLinkUrl', () => {
  it('http, https 주소만 허용한다', () => {
    expect(validateLinkUrl('https://example.com')).toBe('');
    expect(validateLinkUrl('http://example.com/path?q=1')).toBe('');
    expect(validateLinkUrl('  https://example.com  ')).toBe('');
    expect(validateLinkUrl('HTTPS://EXAMPLE.COM')).toBe('');
  });

  it('위험하거나 잘못된 주소를 막는다', () => {
    expect(validateLinkUrl('')).not.toBe('');
    expect(validateLinkUrl('javascript:alert(1)')).not.toBe('');
    expect(validateLinkUrl('ftp://example.com')).not.toBe('');
    expect(validateLinkUrl('example.com')).not.toBe('');
    expect(validateLinkUrl('https://')).not.toBe('');
    expect(validateLinkUrl('https://exa mple.com')).not.toBe('');
  });
});

describe('validateThumbnail', () => {
  it('고르지 않아도 된다', () => {
    expect(validateThumbnail(null)).toBe('');
  });

  it('jpg, png, webp만 허용한다', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
      expect(validateThumbnail(file(type))).toBe('');
    }
    expect(validateThumbnail(file('image/gif'))).not.toBe('');
    expect(validateThumbnail(file('application/pdf'))).not.toBe('');
  });

  it('5MB까지만 허용한다', () => {
    expect(validateThumbnail(file('image/png', 5 * 1024 * 1024))).toBe('');
    expect(validateThumbnail(file('image/png', 5 * 1024 * 1024 + 1))).toBe(
      '5MB 이하 이미지만 올릴 수 있어요',
    );
  });
});

describe('validateDate', () => {
  it('실제로 있는 YYYY-MM-DD만 허용한다', () => {
    expect(validateDate('2026-10-09')).toBe('');
    expect(validateDate('2024-02-29')).toBe('');
    expect(validateDate('')).not.toBe('');
    expect(validateDate('2026-02-30')).not.toBe('');
    expect(validateDate('2026-13-01')).not.toBe('');
    expect(validateDate('2026/10/09')).not.toBe('');
  });
});

describe('validateWork', () => {
  const valid = {
    title: '제목',
    description: '설명',
    category: '앱',
    linkUrl: 'https://example.com',
    date: '2026-10-09',
  };

  it('썸네일 없이도 문제가 없으면 빈 객체를 돌려준다', () => {
    expect(validateWork(valid, null)).toEqual({});
    expect(validateWork(valid, file('image/png'))).toEqual({});
  });

  it('문제가 있는 항목만 담는다', () => {
    const errors = validateWork({ ...valid, title: '' }, file('image/gif'));
    expect(Object.keys(errors).sort()).toEqual(['thumbnail', 'title']);
  });
});

describe('validateCategoryName', () => {
  const existing = ['발표 자료', '앱', 'Web'];

  it('앞뒤 공백을 빼고 1~20자만 허용한다', () => {
    expect(validateCategoryName('', existing)).not.toBe('');
    expect(validateCategoryName('   ', existing)).not.toBe('');
    expect(validateCategoryName('  디자인  ', existing)).toBe('');
    expect(validateCategoryName('가'.repeat(20), existing)).toBe('');
    expect(validateCategoryName('가'.repeat(21), existing)).not.toBe('');
  });

  it('대소문자를 무시하고 기존 카테고리와 겹치면 막는다', () => {
    expect(validateCategoryName('앱', existing)).not.toBe('');
    expect(validateCategoryName(' 앱 ', existing)).not.toBe('');
    expect(validateCategoryName('web', existing)).not.toBe('');
    expect(validateCategoryName('WEB', existing)).not.toBe('');
    expect(validateCategoryName('Webs', existing)).toBe('');
  });
});

describe('validateWork 새 카테고리', () => {
  const base = {
    title: '제목',
    description: '설명',
    linkUrl: 'https://example.com',
    date: '2026-10-09',
  };
  const png = { type: 'image/png', size: 1000 };

  it('새 카테고리를 고르면 이름을 검사한다', () => {
    const options = { categories: ['앱'] };
    expect(validateWork({ ...base, category: NEW_CATEGORY, newCategory: '' }, png, options)).toHaveProperty('newCategory');
    expect(validateWork({ ...base, category: NEW_CATEGORY, newCategory: 'APP' }, png, options)).toEqual({});
    expect(validateWork({ ...base, category: NEW_CATEGORY, newCategory: '앱' }, png, options)).toHaveProperty('newCategory');
  });

  it('기존 카테고리를 고르면 새 이름 칸은 검사하지 않는다', () => {
    expect(validateWork({ ...base, category: '앱', newCategory: '' }, png)).toEqual({});
  });
});
