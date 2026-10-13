import type { Metadata } from 'next';
import { LegalPage, contactEmail } from '@/components/shared/LegalPage';

export const metadata: Metadata = { title: 'Community Guidelines' };

export default function GuidelinesPage() {
  const email = contactEmail();
  return (
    <LegalPage title="Community Guidelines">
      <p>LocalVibe works because neighbors treat each other with respect. These guidelines apply to everything you post, list or send.</p>

      <h2>Be a good neighbor</h2>
      <ul>
        <li>Be kind and respectful, even when you disagree.</li>
        <li>Keep it local and relevant to your community.</li>
        <li>Use your real name or a name your neighbors would recognize.</li>
      </ul>

      <h2>Not allowed</h2>
      <ul>
        <li><strong>Harassment and hate:</strong> threats, bullying, or attacks based on race, ethnicity, religion, gender, sexual orientation, disability or any other identity.</li>
        <li><strong>Scams and spam:</strong> fraudulent listings, phishing, pyramid schemes, repetitive or misleading promotion.</li>
        <li><strong>Misinformation:</strong> false emergency alerts or knowingly spreading false information that could cause harm.</li>
        <li><strong>Private information:</strong> posting someone&apos;s address, phone number, photos or personal details without consent.</li>
        <li><strong>Illegal or dangerous content:</strong> including sale of weapons, drugs or stolen goods, and sexual or violent content.</li>
        <li><strong>Discrimination</strong> in housing, jobs, or services.</li>
      </ul>

      <h2>Emergency alerts</h2>
      <ul>
        <li>Call official emergency services first. Then post to warn neighbors.</li>
        <li>Share only what you know firsthand. Avoid speculation and never post graphic images of victims.</li>
        <li>Choose an honest severity level. False alarms lead to suspension.</li>
      </ul>

      <h2>Marketplace</h2>
      <ul>
        <li>Describe items honestly, with real photos.</li>
        <li>Mark items as sold when they&apos;re gone.</li>
        <li>Meet in public, never pay in advance, and never share verification codes.</li>
      </ul>

      <h2>Reporting and enforcement</h2>
      <p>
        Use the <strong>Report</strong> option on any post, comment, listing or profile. Reports are anonymous. Content that receives several reports is hidden
        automatically until a moderator reviews it. Violations may lead to content removal or account suspension. You can also block anyone from messaging you.
      </p>
      <p>To appeal a decision, email <a href={`mailto:${email}`}>{email}</a>.</p>
    </LegalPage>
  );
}
