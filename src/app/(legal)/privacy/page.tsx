import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침',
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-sm max-w-none text-[var(--foreground)]">
      <h1 className="text-2xl font-bold mb-2">개인정보처리방침</h1>
      <p className="text-sm text-[var(--muted)] mb-8">Last updated: 2026년 4월 8일</p>

      <Section title="1. 소개">
        <p>
          LoreKit(이하 "서비스", "회사")은 이용자의 개인정보를 소중히 여깁니다.
          본 개인정보처리방침은 서비스 이용 과정에서 수집하는 정보, 활용 방법, 보호 방안을 설명합니다.
        </p>
        <p>
          서비스를 이용함으로써 본 방침에 동의한 것으로 간주됩니다.
        </p>
      </Section>

      <Section title="2. 수집하는 정보">
        <p><strong>직접 수집하는 정보:</strong></p>
        <ul>
          <li><strong>계정 정보:</strong> Google OAuth를 통한 이메일 주소 및 프로필 정보</li>
          <li><strong>씨앗(크레딧) 내역:</strong> 구매, 사용, 잔액 기록</li>
          <li>
            <strong>AI 입력 데이터:</strong> Lorecraft, Lorecheck, Simulator 등에 입력한 텍스트 —
            이는 AI 처리를 위해 Anthropic(Claude)으로 전송됩니다
          </li>
        </ul>
        <p><strong>제3자를 통해 수집되는 정보:</strong></p>
        <ul>
          <li>
            <strong>결제 정보:</strong> 씨앗 구매 시 Polar를 통해 처리됩니다.
            카드 정보는 Polar가 관리하며 회사에는 전달되지 않습니다
          </li>
          <li>
            <strong>접속 로그:</strong> Cloudflare를 통해 IP 주소, 접속 시간, 요청 정보 등이 수집될 수 있습니다
          </li>
        </ul>
      </Section>

      <Section title="3. 수집하지 않는 정보">
        <p>회사는 다음 정보를 수집하지 않습니다:</p>
        <ul>
          <li>신용카드 번호, 계좌 정보 등 금융 정보 (Polar가 직접 처리)</li>
          <li>광고 목적의 쿠키 또는 트래킹 데이터</li>
          <li>위치 정보</li>
          <li>생체 정보</li>
        </ul>
      </Section>

      <Section title="4. 이용 목적">
        <p>수집된 정보는 다음 목적으로 활용됩니다:</p>
        <ul>
          <li>계정 인증 및 서비스 제공</li>
          <li>씨앗 크레딧 관리 및 결제 처리</li>
          <li>AI 기능 제공 (Anthropic API 호출)</li>
          <li>서비스 품질 개선 및 오류 분석</li>
          <li>법적 의무 이행 (세금 처리 등)</li>
          <li>이용자 문의 응대</li>
        </ul>
      </Section>

      <Section title="5. 제3자 정보 공유">
        <p>회사는 다음 제3자와 정보를 공유합니다:</p>
        <ul>
          <li>
            <strong>Supabase:</strong> 데이터베이스 및 인증 서비스 제공자.
            계정 정보, 씨앗 내역이 저장됩니다.
          </li>
          <li>
            <strong>Anthropic (Claude):</strong> AI 처리 서비스 제공자.
            서비스에 입력한 텍스트가 AI 응답 생성을 위해 전송됩니다.
            Anthropic의 개인정보처리방침이 적용됩니다.
          </li>
          <li>
            <strong>Polar:</strong> 결제 대행사(Merchant of Record).
            씨앗 구매 시 결제 및 세금 처리를 담당합니다.
            Polar의 개인정보처리방침이 적용됩니다.
          </li>
          <li>
            <strong>Cloudflare:</strong> 인프라 및 보안 서비스 제공자.
            서비스 트래픽 처리 및 보안에 사용됩니다.
          </li>
        </ul>
        <p>
          위 제3자를 제외하고, 이용자의 동의 없이 개인정보를 외부에 공개하거나 판매하지 않습니다.
          단, 법적 요구가 있는 경우는 예외입니다.
        </p>
      </Section>

      <Section title="6. 정보 보존 기간">
        <ul>
          <li><strong>계정 데이터:</strong> 계정 삭제 요청 후 30일 이내 완전 삭제</li>
          <li><strong>결제 및 세금 관련 기록:</strong> 관련 법률에 따라 최대 7년 보존</li>
          <li><strong>Cloudflare 접속 로그:</strong> Cloudflare 정책에 따라 처리</li>
        </ul>
      </Section>

      <Section title="7. 아동 개인정보 보호">
        <p>
          본 서비스는 만 13세 미만 아동을 대상으로 하지 않습니다.
          만 13세 미만 아동의 개인정보를 의도적으로 수집하지 않으며,
          해당 사실을 인지하는 경우 즉시 해당 정보를 삭제합니다.
        </p>
        <p>
          만 13세 미만 아동의 정보가 수집되었다고 생각되시면 tessaxlii@gmail.com으로 연락해 주십시오.
        </p>
      </Section>

      <Section title="8. 이용자 권리">
        <p>이용자는 다음 권리를 행사할 수 있습니다:</p>
        <ul>
          <li>보유 개인정보 열람 요청</li>
          <li>부정확한 정보 수정 요청</li>
          <li>개인정보 삭제 요청 (계정 삭제)</li>
          <li>개인정보 처리 제한 요청</li>
          <li>개인정보 이동(데이터 포터빌리티) 요청</li>
        </ul>
        <p>
          권리 행사 요청은 tessaxlii@gmail.com으로 연락하시면 <strong>30일 이내</strong>에 응답해 드립니다.
        </p>
      </Section>

      <Section title="9. 국제 데이터 이전">
        <p>
          본 서비스는 글로벌 인프라(Supabase, Anthropic, Polar, Cloudflare)를 사용하므로,
          이용자의 데이터가 대한민국 외부로 이전될 수 있습니다.
          이 경우에도 동등한 수준의 개인정보 보호 조치를 적용합니다.
        </p>
      </Section>

      <Section title="10. 보안">
        <p>
          회사는 이용자의 개인정보를 보호하기 위해 다음과 같은 조치를 취합니다:
        </p>
        <ul>
          <li>전송 중 데이터 암호화 (HTTPS/TLS)</li>
          <li>Row Level Security (RLS)를 통한 데이터베이스 접근 제어</li>
          <li>최소 권한 원칙에 따른 접근 관리</li>
        </ul>
        <p>
          완전한 보안을 보장할 수는 없으나, 합리적인 수준의 보호 조치를 유지합니다.
        </p>
      </Section>

      <Section title="11. 방침 변경">
        <p>
          본 개인정보처리방침은 법률 변경, 서비스 변경 등에 따라 업데이트될 수 있습니다.
          중요한 변경 사항은 서비스 내 공지 또는 이메일을 통해 사전 고지합니다.
        </p>
      </Section>

      <Section title="12. 문의">
        <p>개인정보 관련 문의사항은 아래로 연락해 주십시오.</p>
        <p>
          <strong>이메일:</strong>{' '}
          <a href="mailto:tessaxlii@gmail.com" className="text-[var(--accent)] hover:underline">
            tessaxlii@gmail.com
          </a>
        </p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-[var(--foreground)] mb-3 pb-1 border-b border-[var(--border)]">
        {title}
      </h2>
      <div className="space-y-2 text-sm text-[var(--muted)] leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-[var(--accent)] [&_strong]:text-[var(--foreground)]">
        {children}
      </div>
    </section>
  );
}
