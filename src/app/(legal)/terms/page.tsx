import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '서비스 이용약관',
};

export default function TermsPage() {
  return (
    <article className="prose prose-sm max-w-none text-[var(--foreground)]">
      <h1 className="text-2xl font-bold mb-2">서비스 이용약관</h1>
      <p className="text-sm text-[var(--muted)] mb-8">Last updated: 2026년 4월 8일</p>

      <Section title="1. LoreKit 소개">
        <p>
          LoreKit(이하 "서비스")은 창작자, 게임 마스터, TTRPG 플레이어를 위한 AI 기반 세계관 설계 도구입니다.
          Lorecraft, Lorecheck, Simulator 등의 기능을 통해 세계관 구축과 설정 검증을 지원합니다.
        </p>
        <p>
          본 서비스는 Lorekit(이하 "회사")이 운영하며, 서비스 이용 시 본 약관에 동의한 것으로 간주됩니다.
        </p>
      </Section>

      <Section title="2. 이용 자격">
        <p>
          본 서비스는 만 13세 이상의 이용자만 사용할 수 있습니다. 만 13세 미만은 서비스에 가입하거나
          이용할 수 없으며, 이를 위반하여 발생하는 문제에 대해 회사는 책임지지 않습니다.
        </p>
        <p>
          만 18세 미만 미성년자의 경우, 보호자의 동의 하에 서비스를 이용해야 합니다.
        </p>
      </Section>

      <Section title="3. 계정 보안">
        <p>
          이용자는 자신의 계정 정보(이메일, 접근 수단 등)를 안전하게 관리할 책임이 있습니다.
          계정 정보를 타인과 공유하거나 양도하는 행위는 금지됩니다.
        </p>
        <p>
          계정 도용 또는 무단 접근이 의심되는 경우 즉시 tessaxlii@gmail.com으로 신고해 주십시오.
          본인 계정의 모든 활동에 대한 책임은 이용자에게 있습니다.
        </p>
      </Section>

      <Section title="4. 허용 이용">
        <p>본 서비스는 다음과 같은 목적으로 이용할 수 있습니다:</p>
        <ul>
          <li>소설, 단편, 시나리오 등 창작 활동</li>
          <li>게임 세계관 및 설정 개발</li>
          <li>TTRPG(테이블탑 롤플레잉 게임) 캠페인 및 세계 설계</li>
          <li>개인적 또는 상업적 창작 프로젝트</li>
        </ul>
      </Section>

      <Section title="5. 금지 이용">
        <p>다음 목적으로의 서비스 이용은 엄격히 금지됩니다:</p>
        <ul>
          <li>성인(NSFW) 콘텐츠, 음란물 생성</li>
          <li>폭력, 혐오, 차별을 조장하는 콘텐츠 생성</li>
          <li>미성년자에게 유해한 콘텐츠 생성</li>
          <li>스팸, 피싱, 사기 등 불법적 목적</li>
          <li>서비스 출력물의 무단 재판매 또는 재배포</li>
          <li>AI 시스템 우회, 프롬프트 인젝션, 서비스 악용</li>
          <li>타인의 지식재산권, 개인정보 침해</li>
        </ul>
        <p>
          회사는 금지 이용이 확인된 계정을 사전 통보 없이 정지 또는 영구 삭제할 수 있습니다.
        </p>
      </Section>

      <Section title="6. 씨앗(Seeds) — 크레딧 시스템">
        <p>
          씨앗(Seeds)은 LoreKit 서비스의 AI 기능을 이용하기 위한 내부 크레딧입니다.
        </p>
        <ul>
          <li><strong>양도 불가:</strong> 씨앗은 다른 계정으로 이전하거나 현금으로 환전할 수 없습니다.</li>
          <li><strong>만료 없음:</strong> 씨앗에는 유효기간이 없습니다.</li>
          <li><strong>소비 분 환불 불가:</strong> 이미 AI 기능에 사용된 씨앗은 환불되지 않습니다.</li>
          <li><strong>신규 가입 지급:</strong> 신규 가입 시 씨앗 6개가 자동으로 지급됩니다.</li>
        </ul>
        <p>미사용 씨앗의 환불은 제7조 및 환불정책(/refund)을 따릅니다.</p>
      </Section>

      <Section title="7. 결제">
        <p>
          씨앗 구매는 Polar.sh를 통해 처리됩니다. Polar는 본 서비스의 공식 결제 대행사(Merchant of Record)로,
          결제, 세금 계산 및 납부, 영수증 발행을 담당합니다.
        </p>
        <ul>
          <li><strong>통화:</strong> 모든 결제는 USD(미국 달러) 기준입니다.</li>
          <li><strong>세금:</strong> 해당 국가/지역의 세금(VAT, GST 등)은 Polar가 자동 계산하여 처리합니다.</li>
          <li><strong>영수증:</strong> 결제 완료 후 Polar로부터 영수증이 발송됩니다.</li>
        </ul>
      </Section>

      <Section title="8. 환불">
        <p>
          환불 정책은 별도 페이지(/refund)에서 확인하실 수 있습니다.
          결제 대행사인 Polar는 자체 판단에 따라 구매일로부터 60일 이내에 환불을 처리할 수 있습니다.
        </p>
      </Section>

      <Section title="9. 지식재산권">
        <p>
          이용자가 서비스에 입력한 텍스트, 설정, 데이터(이하 "입력물")에 대한 권리는 이용자에게 귀속됩니다.
        </p>
        <p>
          서비스가 생성한 AI 출력물(이하 "출력물")에 대해서도 이용자가 권리를 보유합니다.
          다만, AI 생성물의 저작권 귀속에 관한 각국 법률이 상이할 수 있으므로, 상업적 이용 전
          해당 국가의 법률을 확인하시기 바랍니다.
        </p>
        <p>
          이용자는 회사에게 서비스 개선 목적으로 입력물 및 출력물을 익명화하여 활용할 수 있는
          비독점적 라이선스를 부여합니다.
        </p>
        <p>
          LoreKit 로고, 브랜드, 소프트웨어 코드 등 서비스 자체의 지식재산권은 회사에 귀속됩니다.
        </p>
      </Section>

      <Section title="10. 보증 부인">
        <p>
          본 서비스는 "있는 그대로(AS IS)" 제공됩니다. 회사는 서비스의 정확성, 완전성,
          특정 목적 적합성에 대해 명시적 또는 묵시적 보증을 하지 않습니다.
        </p>
        <p>
          AI가 생성한 콘텐츠는 부정확하거나 불완전할 수 있습니다. 창작 참고 자료로만 활용하시고,
          사실 정보로 의존하지 마십시오.
        </p>
      </Section>

      <Section title="11. 책임 제한">
        <p>
          관련 법률이 허용하는 최대 범위 내에서, 회사는 서비스 이용으로 인한 간접적, 부수적,
          특별적, 결과적 손해에 대해 책임지지 않습니다.
        </p>
        <p>
          회사의 총 책임은 청구일 이전 12개월간 이용자가 지불한 금액을 초과하지 않습니다.
        </p>
      </Section>

      <Section title="12. 계정 해지">
        <p>
          이용자는 언제든지 My Page에서 계정을 삭제할 수 있습니다. 계정 삭제 시 모든 데이터와
          미사용 씨앗이 소멸됩니다. 단, 환불 가능 조건을 충족하는 미사용 씨앗은 삭제 전에 환불을 요청할 수 있습니다.
        </p>
        <p>
          회사는 이용약관 위반 시 사전 통보 없이 계정을 정지 또는 삭제할 수 있습니다.
        </p>
      </Section>

      <Section title="13. 준거법">
        <p>
          본 약관은 대한민국 법률에 따라 해석되고 적용됩니다.
          분쟁 발생 시 대한민국 법원을 관할 법원으로 합니다.
        </p>
      </Section>

      <Section title="14. 약관 변경">
        <p>
          회사는 필요한 경우 본 약관을 변경할 수 있습니다. 중요한 변경 사항은 시행 14일 전에
          서비스 내 공지 또는 이메일을 통해 사전 고지합니다.
        </p>
        <p>
          변경 후에도 서비스를 계속 이용하는 경우, 변경된 약관에 동의한 것으로 간주됩니다.
        </p>
      </Section>

      <Section title="15. 문의">
        <p>
          본 약관에 관한 문의사항은 아래로 연락해 주십시오.
        </p>
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
