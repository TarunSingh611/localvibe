import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, contactEmail } from '@/components/shared/LegalPage';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  const email = contactEmail();
  return (
    <LegalPage title="Terms of Service">
      <p>
        Welcome to LocalVibe. By creating an account or using LocalVibe (the &quot;Service&quot;) you agree to these Terms. If you do not agree, please do not use the
        Service.
      </p>

      <h2>1. Who can use LocalVibe</h2>
      <p>You must be at least 13 years old (or the minimum age of digital consent in your country) to use LocalVibe. You are responsible for keeping your login details secure and for all activity on your account.</p>

      <h2>2. Your content</h2>
      <p>
        You own the posts, comments, photos, listings and messages you share. By posting, you give LocalVibe a worldwide, non-exclusive, royalty-free licence to host,
        display and distribute that content solely to operate and improve the Service. You can delete your content or account at any time.
      </p>
      <p>You promise that you have the rights to everything you post and that it follows our <Link href="/guidelines">Community Guidelines</Link>.</p>

      <h2>3. Marketplace</h2>
      <p>
        LocalVibe only connects buyers and sellers. We are not a party to any transaction, do not handle payments, and make no guarantees about items, their quality,
        safety or legality. You must not list illegal, stolen, counterfeit, dangerous or prohibited items (including weapons, drugs, alcohol, tobacco, animals, or
        recalled products). Meet in public places and use good judgement.
      </p>

      <h2>4. Emergency features</h2>
      <p>
        <strong>LocalVibe is not an emergency service.</strong> We do not monitor alerts in real time or dispatch help. Emergency alerts are posted by users and may be
        inaccurate, incomplete or delayed. Always contact official emergency services first. Emergency numbers are provided for convenience; verify them with your
        local authorities. Posting false emergency alerts is strictly prohibited and may be reported to authorities.
      </p>

      <h2>5. Prohibited conduct</h2>
      <ul>
        <li>Harassment, hate speech, threats, or discrimination.</li>
        <li>Spam, scams, fraud, or impersonation.</li>
        <li>Sharing other people&apos;s private information without consent.</li>
        <li>Illegal content or activity, or content that infringes others&apos; rights.</li>
        <li>Attempting to disrupt, scrape, reverse engineer or gain unauthorized access to the Service.</li>
      </ul>

      <h2>6. Moderation and termination</h2>
      <p>We may remove content or suspend accounts that violate these Terms or our Community Guidelines, with or without notice. You may stop using the Service and delete your account at any time from Settings.</p>

      <h2>7. Disclaimers</h2>
      <p>
        The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. We do not verify users or their content and are not
        responsible for the conduct of any user, online or offline.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, LocalVibe and its operators will not be liable for any indirect, incidental, special, consequential or punitive
        damages, or any loss arising from your use of the Service, transactions with other users, or reliance on user-generated information.
      </p>

      <h2>9. Changes</h2>
      <p>We may update these Terms. If changes are significant we will notify you in the app. Continuing to use LocalVibe after changes means you accept them.</p>

      <h2>10. Contact</h2>
      <p>Questions? Email <a href={`mailto:${email}`}>{email}</a>.</p>
    </LegalPage>
  );
}
