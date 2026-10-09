import characterUrl from '../image/profile.png';

// 로딩, 빈 화면, 오류 화면에서 캐릭터와 짧은 문구를 가운데에 보여준다.
export default function CharacterMessage({ message, role, children }) {
  return (
    <div className="character-message" role={role}>
      <img className="character-message__image" src={characterUrl} alt="뽀글쌤 캐릭터" />
      <p className="character-message__text">{message}</p>
      {children}
    </div>
  );
}
