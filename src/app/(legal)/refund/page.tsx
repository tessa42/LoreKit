import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '환불 정책',
};

export default function RefundPage() {
  return (
    <article className="prose prose-sm max-w-none text-[var(--foreground)]">
      <h1 className="text-2xl font-bold mb-2">환불 정책</h1>
      <p className="text-sm text-[var(--muted)] mb-8">Last updated: 2026년 4월 8일</p>

      <Section title="1. 개요">
        <p>
          LoreKit의 씨앗(Seeds) 구매는 결제 대행사인 <strong>Polar</strong>를 통해 처리됩니다.
          Polar는 본 서비스의 공식 Merchant of Record(결제 판매인)로, 결제, 세금, 환불 처리를 담당합니다.
        </p>
        <p>
          환불 요청은 Polar의 환불 정책 및 본 정책에 따라 처리되며, Polar는 자체 판단에 따라
          구매일로부터 60일 이내에 환불을 처리할 권한을 보유합니다.
        </p>
      </Section>

      <Section title="2. 환불 자격">
        <p><strong>전액 환불:</strong></p>
        <ul>
          <li>구매한 씨앗을 <strong>전혀 사용하지 않은 경우</strong></li>
          <li>구매일로부터 <strong>14일 이내</strong>에 요청한 경우</li>
        </ul>

        <p><strong>부분 환불:</strong></p>
        <ul>
          <li>씨앗 일부를 사용한 경우, <strong>미사용 씨앗 분에 대해 부분 환불</strong>이 가능합니다</li>
          <li>구매일로부터 14일 이내에 요청해야 합니다</li>
        </ul>

        <p><strong>환불 불가:</strong></p>
        <ul>
          <li>씨앗을 <strong>전부 사용</strong>한 경우</li>
          <li>구매일로부터 <strong>14일을 초과</strong>한 경우</li>
          <li>이용약관 위반으로 계정이 정지된 경우</li>
        </ul>

        <p><strong>EU 소비자 철회권:</strong></p>
        <ul>
          <li>
            EU/EEA 거주 이용자는 관련 법률에 따라 구매일로부터 14일 이내 철회권을 행사할 수 있습니다.
            단, 디지털 콘텐츠(씨앗)를 이미 사용하기 시작한 경우에는 철회권이 제한될 수 있습니다.
          </li>
        </ul>
      </Section>

      <Section title="3. 환불 불가 사유">
        <p>다음의 경우에는 환불이 제공되지 않습니다:</p>
        <ul>
          <li>AI 기능(Lorecraft, Lorecheck, Simulator 등) 이용에 소비된 씨앗</li>
          <li>AI 생성 결과물의 품질에 대한 불만족 (AI 특성상 결과 보장 불가)</li>
          <li>이용약관 위반으로 계정 정지 또는 삭제된 경우</li>
          <li>구매 후 14일 초과</li>
          <li>씨앗 전량 소비</li>
        </ul>
        <p>
          참고: 신용카드 수수료 등 Polar가 부담하는 결제 처리 비용은 환불 금액에서 제외될 수 있습니다.
        </p>
      </Section>

      <Section title="4. 환불 신청 방법">
        <p>환불을 요청하려면 아래 이메일로 연락해 주십시오:</p>
        <p>
          <strong>이메일:</strong>{' '}
          <a href="mailto:tessaxlii@gmail.com" className="text-[var(--accent)] hover:underline">
            tessaxlii@gmail.com
          </a>
        </p>
        <p>이메일에 다음 정보를 포함해 주십시오:</p>
        <ul>
          <li>계정 이메일 주소</li>
          <li>구매일 및 구매한 씨앗 패키지</li>
          <li>환불 요청 사유</li>
          <li>Polar 주문 번호 (이메일 영수증에서 확인 가능)</li>
        </ul>
        <ul>
          <li><strong>응답 기간:</strong> 영업일 기준 3일 이내</li>
          <li><strong>환불 처리:</strong> 승인 후 영업일 기준 5~10일 이내 원결제 수단으로 환불</li>
        </ul>
      </Section>

      <Section title="5. 분쟁 해결">
        <p>
          환불 관련 분쟁이 발생하는 경우, 먼저 tessaxlii@gmail.com으로 연락하여 협의를 시도해 주십시오.
          결제 대행사인 Polar를 통해 분쟁 조정이 이루어질 수 있습니다.
        </p>
        <p>
          협의가 해결되지 않는 경우, 이용자는 해당 국가의 소비자 보호 기관에 도움을 요청할 수 있습니다.
        </p>
      </Section>

      <Section title="6. 정책 변경">
        <p>
          본 환불 정책은 변경될 수 있습니다. 변경 사항은 서비스 내 공지 또는 이메일을 통해 사전 고지하며,
          변경 전에 구매한 씨앗에는 구매 당시의 정책이 적용됩니다.
        </p>
      </Section>

      <Section title="7. 문의">
        <p>환불 정책 및 환불 요청에 관한 문의사항은 아래로 연락해 주십시오.</p>
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
