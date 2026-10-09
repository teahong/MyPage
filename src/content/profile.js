// 첫 페이지 왼쪽 소개와 "소개", "경력" 섹션에 들어가는 글. 이 파일만 고치면 화면에 반영된다.
// philosophy는 문단 배열, experience는 최근 것부터 적는다. 비워 두면 그 섹션은 나오지 않는다.
const profile = {
  name: '홍수빈',
  role: '하는 일을 한 줄로 적어 주세요',
  tagline: '작업 철학을 한 문장으로 적어 주세요',
  philosophy: [
    '여기에 작업 철학을 적어 주세요. 어떤 마음으로 일하는지, 무엇을 중요하게 여기는지 두세 문단이면 충분해요.',
    '두 번째 문단 예시예요. src/content/profile.js 파일에서 고칠 수 있어요.',
  ],
  experience: [
    {
      period: '2024 — 현재',
      role: '직무 예시',
      organization: '소속 예시',
      description: '맡은 일과 성과를 한두 문장으로 적어 주세요.',
      tags: ['키워드', '예시'],
    },
    {
      period: '2021 — 2023',
      role: '직무 예시',
      organization: '소속 예시',
      description: '이전 경력도 같은 형식으로 적어 주세요.',
      tags: ['키워드'],
    },
  ],
};

export default profile;
