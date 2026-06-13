import { useNavigate } from "react-router-dom";

const FEATURE_CARDS = [
  { emoji: "🗺️", title: "동네 모각작 모임", desc: "내 근처에서 바이브코더들을 만나요" },
  { emoji: "💬", title: "바이브코딩 게시판", desc: "꿀팁과 후기를 나눠요" },
  { emoji: "🚀", title: "프로덕트 쇼케이스", desc: "만든 서비스를 소개해요" },
  { emoji: "🤝", title: "신청 & 수락", desc: "호스트가 승인하면 연락처 공유" },
];

const STEPS = [
  {
    n: "01",
    title: "모각작 모임 참여",
    desc: "강남·성수·판교 근처 카페 모임을 찾아 신청해요. 호스트가 수락하면 이메일로 연락처가 공유돼요.",
    icon: "☕",
  },
  {
    n: "02",
    title: "게시판에서 함께 성장",
    desc: "Claude로 뭘 만들었는지, GPT 프롬프트 꿀팁, 막히는 부분 — 뭐든 올리면 같은 바이브코더들이 답해줘요.",
    icon: "💬",
  },
  {
    n: "03",
    title: "완성작을 쇼케이스에",
    desc: "드디어 배포한 그 서비스, 혼자 간직하지 말고 올려요. 같은 고민을 가진 사람들이 제일 잘 알아봐줘요.",
    icon: "🚀",
  },
];

const FOR_WHO = [
  { emoji: "🤖", text: "Claude·Cursor로 사이드 프로젝트를 만들고 있는 분" },
  { emoji: "😮‍💨", text: "혼자 작업하다 집중이 안 돼 카페를 찾는 분" },
  { emoji: "🌱", text: "완성한 프로덕트를 공유하고 피드백 받고 싶은 분" },
  { emoji: "🤝", text: "같은 관심사의 개발자·디자이너를 오프라인에서 만나고 싶은 분" },
];

export default function AboutScreen() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col bg-[#fafbfb] min-h-full">

      {/* ── 히어로 ── */}
      <section className="relative overflow-hidden bg-white px-6 pt-12 pb-10 lg:px-10 lg:pt-16 lg:pb-14">

        {/* 배경 블러 서클 */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[#ae49fd]/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-48 h-48 rounded-full bg-[#ae49fd]/6 blur-2xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-8">

          {/* 텍스트 영역 */}
          <div className="flex-1 flex flex-col gap-5">
            <span className="inline-flex items-center gap-1.5 w-fit bg-[#f4e5ff] text-[#ae49fd] text-[12px] font-bold px-3 py-1.5 rounded-full tracking-wide">
              💻 같이바코할사람
            </span>
            <h1 className="text-[32px] lg:text-[40px] font-bold text-[#101828] leading-[1.2] tracking-[-1px]">
              혼자 코딩하기<br />지치셨나요?
            </h1>
            <p className="text-[15px] text-[#6a7282] leading-relaxed tracking-[-0.32px] max-w-[340px]">
              바이브코더들이 동네 카페에 모여 각자 프로젝트를 만드는 모각작 커뮤니티예요.
            </p>
            <div className="flex gap-3 mt-1">
              <button
                onClick={() => navigate("/home")}
                className="flex items-center gap-2 px-5 py-3 bg-[#101828] text-white text-[14px] font-bold rounded-[14px] hover:opacity-90 active:scale-[0.98] transition-all"
              >
                모임 둘러보기 →
              </button>
              <button
                onClick={() => navigate("/product")}
                className="px-5 py-3 bg-[#f4f6fa] text-[#364153] text-[14px] font-bold rounded-[14px] hover:bg-[#edeef2] transition-colors"
              >
                프로덕트 보기
              </button>
            </div>
          </div>

          {/* 플로팅 카드 그리드 */}
          <div className="relative flex-shrink-0 w-full lg:w-[300px] h-[280px] lg:h-[320px]">
            {/* 카드 1 - 왼쪽 상단 */}
            <FeatureCard
              emoji={FEATURE_CARDS[0].emoji}
              title={FEATURE_CARDS[0].title}
              desc={FEATURE_CARDS[0].desc}
              className="absolute top-0 left-0 w-[170px]"
            />
            {/* 카드 2 - 오른쪽 상단, 살짝 아래 */}
            <FeatureCard
              emoji={FEATURE_CARDS[1].emoji}
              title={FEATURE_CARDS[1].title}
              desc={FEATURE_CARDS[1].desc}
              className="absolute top-[40px] right-0 w-[155px]"
            />
            {/* 카드 3 - 왼쪽 하단, 살짝 아래 */}
            <FeatureCard
              emoji={FEATURE_CARDS[2].emoji}
              title={FEATURE_CARDS[2].title}
              desc={FEATURE_CARDS[2].desc}
              className="absolute bottom-[20px] left-[20px] w-[160px]"
            />
            {/* 카드 4 - 오른쪽 하단 */}
            <FeatureCard
              emoji={FEATURE_CARDS[3].emoji}
              title={FEATURE_CARDS[3].title}
              desc={FEATURE_CARDS[3].desc}
              className="absolute bottom-0 right-0 w-[150px]"
            />
          </div>
        </div>
      </section>

      {/* ── 서비스 소개 ── */}
      <section className="px-6 lg:px-10 py-10">
        <div className="bg-[#f4f6fa] rounded-[24px] p-7 lg:p-9">
          <p className="text-[13px] font-bold tracking-widest text-[#ae49fd] mb-3">ABOUT</p>
          <h2 className="text-[22px] lg:text-[26px] font-bold text-[#101828] leading-snug tracking-[-0.5px] mb-4">
            같은 공간, 각자의 프로젝트.<br />그게 모각작이에요.
          </h2>
          <p className="text-[14px] text-[#6a7282] leading-relaxed mb-6">
            AI 도구로 사이드 프로젝트를 만드는 바이브코더들이 동네 카페에 모여 함께 작업해요.
            혼자서는 금방 지치는 작업도, 옆에 누군가 있으면 훨씬 오래 집중할 수 있거든요.
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-[18px]">⚡</span>
              <div>
                <p className="text-[13px] font-bold text-[#101828] mb-0.5">집중력이 올라가요</p>
                <p className="text-[12px] text-[#99a1af] leading-relaxed">같은 목적으로 모인 사람들 사이에서 작업하면 혼자 할 때보다 훨씬 오래 집중할 수 있어요.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-[18px]">🧩</span>
              <div>
                <p className="text-[13px] font-bold text-[#101828] mb-0.5">막히면 바로 물어봐요</p>
                <p className="text-[12px] text-[#99a1af] leading-relaxed">AI한테만 물어보는 거 질리지 않으셨나요? 옆에 앉은 바이브코더에게 물어보는 게 더 빠를 때도 있어요.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-[18px]">🌐</span>
              <div>
                <p className="text-[13px] font-bold text-[#101828] mb-0.5">오프라인 네트워크가 생겨요</p>
                <p className="text-[12px] text-[#99a1af] leading-relaxed">온라인 커뮤니티와는 다르게, 얼굴 아는 개발자·디자이너가 생기고 그게 가장 오래 가는 연결이에요.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 이런 분들께 딱 ── */}
      <section className="px-6 lg:px-10 pb-10">
        <p className="text-[13px] font-bold text-[#ae49fd] tracking-widest mb-5">FOR WHO</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FOR_WHO.map((item) => (
            <div key={item.text} className="bg-white rounded-[16px] px-5 py-4 flex items-center gap-3">
              <span className="text-[24px] flex-shrink-0">{item.emoji}</span>
              <p className="text-[13px] text-[#364153] leading-snug tracking-[-0.32px]">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 이용 방법 ── */}
      <section className="px-6 lg:px-10 pb-10">
        <p className="text-[13px] font-bold text-[#ae49fd] tracking-widest mb-5">HOW IT WORKS</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-white rounded-[18px] p-5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-[#ae49fd] tracking-wide">{s.n}</span>
                <span className="text-[20px]">{s.icon}</span>
              </div>
              <h3 className="text-[15px] font-bold text-[#101828] tracking-[-0.32px] leading-snug">{s.title}</h3>
              <p className="text-[12px] text-[#99a1af] leading-relaxed tracking-[-0.32px]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 lg:px-10 pb-12">
        <div className="bg-[#101828] rounded-[24px] p-7 flex flex-col items-center text-center gap-4">
          <div className="text-4xl">☕</div>
          <h3 className="text-[20px] font-bold text-white leading-snug tracking-[-0.5px]">
            지금 내 근처<br />모각작 모임을 찾아보세요
          </h3>
          <button
            onClick={() => navigate("/home")}
            className="mt-1 px-8 py-3.5 bg-[#ae49fd] text-white text-[15px] font-bold rounded-[14px] hover:opacity-90 active:scale-[0.98] transition-all"
          >
            모임 시작하기
          </button>
        </div>
      </section>

      {/* ── 푸터 ── */}
      <footer className="px-6 lg:px-10 py-6 border-t border-[#f0f1f3] flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[12px] text-[#c2c7d0]">© 2026 nove</p>
        <div className="flex items-center gap-4">
          <a href="/about" className="text-[12px] text-[#99a1af] hover:text-[#364153] transition-colors">서비스 소개</a>
          <span className="text-[#e5e7eb]">·</span>
          <a href="#" className="text-[12px] text-[#99a1af] hover:text-[#364153] transition-colors">개인정보처리방침</a>
          <span className="text-[#e5e7eb]">·</span>
          <a href="mailto:thenovelabs@gmail.com" className="text-[12px] text-[#99a1af] hover:text-[#364153] transition-colors">문의하기</a>
        </div>
      </footer>

    </div>
  );
}

function FeatureCard({
  emoji,
  title,
  desc,
  className = "",
}: {
  emoji: string;
  title: string;
  desc: string;
  className?: string;
}) {
  return (
    <div
      className={`bg-white rounded-[18px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-4 flex flex-col gap-1.5 ${className}`}
    >
      <span className="text-[24px] leading-none">{emoji}</span>
      <p className="text-[13px] font-bold text-[#101828] leading-snug tracking-[-0.32px]">{title}</p>
      <p className="text-[11px] text-[#99a1af] leading-relaxed tracking-[-0.32px]">{desc}</p>
    </div>
  );
}
