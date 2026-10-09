import { describe, expect, it } from 'vitest';
import {
  validateCategory,
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
  it('추가 화면에서는 필수, 수정 화면에서는 선택이다', () => {
    expect(validateThumbnail(null, { required: true })).not.toBe('');
    expect(validateThumbnail(null, { required: false })).toBe('');
  });

  it('jpg, png, webp만 허용한다', () => {
    for (const type of ['image/jpeg', 'image/png', 'image/webp']) {
      expect(validateThumbnail(file(type), { required: true })).toBe('');
    }
    expect(validateThumbnail(file('image/gif'), { required: true })).not.toBe('');
    expect(validateThumbnail(file('application/pdf'), { required: true })).not.toBe('');
  });

  it('5MB까지만 허용한다', () => {
    expect(validateThumbnail(file('image/png', 5 * 1024 * 1024), { required: true })).toBe('');
    expect(validateThumbnail(file('image/png', 5 * 1024 * 1024 + 1), { required: true })).toBe(
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

  it('문제가 없으면 빈 객체를 돌려준다', () => {
    expect(validateWork(valid, file('image/png'), { requireThumbnail: true })).toEqual({});
  });

  it('문제가 있는 항목만 담는다', () => {
    const errors = validateWork({ ...valid, title: '' }, null, { requireThumbnail: true });
    expect(Object.keys(errors).sort()).toEqual(['thumbnail', 'title']);
  });
});
