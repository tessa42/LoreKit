export default function Terms() {
  return (
    <div className="page-wrapper">
      <div className="legal-page animate-fade-up">
        <h1>Terms of Service</h1>
        <p className="legal-page__updated">Last updated: June 2025</p>

        <section>
          <h2>1. About LoreKit</h2>
          <p>
            LoreKit is an AI-powered worldbuilding toolkit designed for fiction writers, game masters,
            and creative storytellers. It helps users craft, verify, and explore fictional worlds
            through AI-assisted analysis and generation.
          </p>
        </section>

        <section>
          <h2>2. Eligibility</h2>
          <p>
            LoreKit is intended for users aged <strong>13 and older</strong>. By creating an account
            or using our services, you confirm that you meet this age requirement. Users under 18
            should have parental or guardian consent.
          </p>
        </section>

        <section>
          <h2>3. Acceptable Use</h2>
          <p>LoreKit may be used for:</p>
          <ul>
            <li>Creative fiction writing and worldbuilding</li>
            <li>Game design and tabletop role-playing game (TTRPG) preparation</li>
            <li>Narrative development, lore documentation, and story research</li>
            <li>Educational and non-commercial creative projects</li>
          </ul>
        </section>

        <section>
          <h2>4. Prohibited Use</h2>
          <p>You may not use LoreKit to:</p>
          <ul>
            <li>Generate adult, explicit, or sexually suggestive content (NSFW)</li>
            <li>Create content that depicts or promotes violence, abuse, or illegal activity</li>
            <li>Produce content targeting or harmful to minors</li>
            <li>Impersonate real individuals or create defamatory content</li>
            <li>Circumvent AI safety measures or content policies of underlying AI providers</li>
            <li>Use outputs for spam, misinformation, or deceptive purposes</li>
          </ul>
          <p>
            LoreKit's AI features are powered by OpenAI and are subject to{' '}
            <a href="https://openai.com/policies/usage-policies" target="_blank" rel="noopener noreferrer">
              OpenAI's usage policies
            </a>.
          </p>
        </section>

        <section>
          <h2>5. Nutrients (AI Credits)</h2>
          <p>
            "Nutrients" are AI usage credits that power LoreKit's AI features (LoreCraft, LoreCheck,
            and Simulator). Credits are consumed when AI-powered features are used. Credits are
            non-transferable and have no monetary value outside of LoreKit. Purchased credits are
            non-refundable once consumed.
          </p>
        </section>

        <section>
          <h2>6. Simulator</h2>
          <p>
            The Simulator is a creative fiction tool that generates a fictional character card by
            assigning your chosen name and vibe to one of twelve handcrafted story worlds. It is
            purely a creative storytelling aid. Portrait images are processed entirely client-side
            and are never transmitted to our servers.
          </p>
        </section>

        <section>
          <h2>7. Content Ownership</h2>
          <p>
            You retain ownership of the content you input into LoreKit. LoreKit does not claim
            ownership of AI-generated outputs produced in response to your inputs. You are
            responsible for ensuring your use of outputs complies with applicable laws and
            third-party rights.
          </p>
        </section>

        <section>
          <h2>8. Disclaimer</h2>
          <p>
            LoreKit is provided "as is" without warranty of any kind. AI-generated content may
            contain inaccuracies. LoreKit is a creative aid, not a factual reference source.
          </p>
        </section>

        <section>
          <h2>9. Changes</h2>
          <p>
            We may update these terms at any time. Continued use of LoreKit after updates
            constitutes acceptance of the revised terms.
          </p>
        </section>

        <section>
          <h2>10. Contact</h2>
          <p>
            For questions about these terms, please contact us via the LoreKit support channel.
          </p>
        </section>
      </div>
    </div>
  );
}
