// PIN 로그인, 삭제 전 PIN 확인이 같이 쓰는 오류 문구. 키는 authService가 붙이는 code.
export const PIN_LENGTH = 6;

export const PIN_ERROR_MESSAGES = {
  wrong: 'PIN이 맞지 않아요. 다시 입력해 주세요',
  rate_limit: '시도가 너무 많아요. 잠시 후 다시 시도해 주세요',
  captcha: '로봇 확인에 실패했어요. 다시 시도해 주세요',
  unknown: '로그인하지 못했어요. 다시 시도해 주세요',
  widget: '로봇 확인을 불러오지 못했어요. 새로고침해 주세요',
};
