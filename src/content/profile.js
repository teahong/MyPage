// 첫 페이지 왼쪽 소개와 "소개", "경력" 섹션에 들어가는 글. 이 파일만 고치면 화면에 반영된다.
// philosophy는 문단 배열, experience는 최근 것부터 적는다. 비워 두면 그 섹션은 나오지 않는다.
const profile = {
  name: '홍수빈',
  role: '초등 컴퓨터교육 전문가',
  tagline: '작업 철학을 한 문장으로 적어 주세요',
  philosophy: [
    '여기에 작업 철학을 적어 주세요. 어떤 마음으로 일하는지, 무엇을 중요하게 여기는지 두세 문단이면 충분해요.',
    '두 번째 문단 예시예요. src/content/profile.js 파일에서 고칠 수 있어요.',
  ],
  experience: [
    { period: '2025', role: '읽걷쓰 기반 AI교육 프레임워크 개발', organization: '인천광역시교육청' },
    { period: '2025', role: 'RISE 늘봄학교 프로그램 개발 운영 사업 연수 강사 및 자문단', organization: '교육부' },
    { period: '2025', role: '늘봄학교 프로그램 개발 운영 사업 연수 강사 및 자문단', organization: '한국과학창의재단' },
    { period: '2024', role: '늘봄학교 프로그램 개발 운영 사업', organization: '한국과학창의재단' },
    { period: '2024', role: '『챗GPT와 썸타기』 집필', organization: '성안당' },
    { period: '2023 — 현재', role: '디지털 새싹 사업 프로그램 개발 및 운영', organization: '한국과학창의재단' },
    { period: '2023', role: '2023년 디지털 교육 활성화 유공 표창', organization: '부총리겸교육부장관' },
    { period: '2023', role: '늘봄학교 프로그램 개발 운영 사업 운영 및 개발', organization: '한국과학창의재단' },
    { period: '2023', role: '창의협력지능 수업 모델을 활용한 창의교육센터 프로그램 개발 및 강의' },
    { period: '2020', role: '『컴퓨팅 사고력 UP 마이크로비트로 메이커 되기』 집필', organization: '생능출판사' },
    { period: '2020', role: '『AI 사고를 위한 인공지능 랩』 집필', organization: '성안당' },
    { period: '2020', role: '인천형 착한 인공지능교육 프레임워크 및 프로그램 개발', organization: '인천광역시교육청' },
    { period: '2019 — 현재', role: '사무국장', organization: '한국인공지능교육학회' },
    { period: '2019', role: '소프트웨어(SW) 교육 유공 교원 표창', organization: '부총리겸교육부장관' },
    { period: '2018', role: '내 아이디어를 실현하는 SW교육 원격연수', organization: '교원캠퍼스' },
    { period: '2018', role: '스크래치와 함께 하는 창의 컴퓨팅 원격연수', organization: '교원캠퍼스' },
    { period: '2017', role: '뚜루뚜루 로봇 교육콘텐츠 개발', organization: '아이스크림 미디어' },
    { period: '2017', role: '『스크래치 창의컴퓨팅』 집필', organization: '성안당' },
    { period: '2016', role: 'SW강좌 영상콘텐츠 제작 참여', organization: '경성대학교' },
    { period: '2015', role: '소프트웨어 창의캠프 강사', organization: '미래창조과학부' },
    { period: '2015', role: '『스크래치와 함께 하는 창의컴퓨팅』 가이드북, 워크북', organization: '생능출판' },
    { period: '2015', role: '『스크래치 창의컴퓨팅』 집필', organization: '성안당' },
    { period: '2013 — 2014', role: '주니어소프트웨어 아카데미 교재 제작 참여', organization: '삼성전자' },
    { period: '2013 — 2015', role: 'Scratch Day in Korea 강사', organization: '미래인재연구소' },
    { period: '2013', role: '『스크래치와 함께 하는 창의 놀이터』집필', organization: '책과 나무' },
  ],
};

export default profile;
