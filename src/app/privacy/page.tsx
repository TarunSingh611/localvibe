import type { Metadata } from 'next';
import { LegalPage, contactEmail } from '@/components/shared/LegalPage';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  const email = contactEmail();
  return (
    <LegalPage title="Privacy Policy">
      <p>This policy explains what information LocalVibe collects, how we use it, and the choices you have. We keep data collection to the minimum needed to run a neighborhood community.</p>

      <h2>Information we collect</h2>
      <ul>
        <li><strong>Account details:</strong> name, username, email address, a securely hashed password (or your Google account ID if you sign in with Google), and optional profile photo and bio.</li>
        <li><strong>Location:</strong> the neighborhood you choose and its approximate coordinates, used to show nearby content. We do not track your location in the background.</li>
        <li><strong>Content:</strong> posts, comments, photos, listings, reports, and private messages you send.</li>
        <li><strong>Technical data:</strong> IP address and basic request logs used for security, abuse prevention and rate limiting.</li>
      </ul>

      <h2>How we use information</h2>
      <ul>
        <li>To operate the Service: showing nearby posts and listings, delivering messages and notifications.</li>
        <li>To keep the community safe: moderating reported content, preventing spam and abuse.</li>
        <li>To send essential emails such as password resets and, if enabled, nearby emergency alerts.</li>
      </ul>
      <p>We do <strong>not</strong> sell your personal information or use it for third-party advertising.</p>

      <h2>What others can see</h2>
      <p>
        Your name, username, profile photo, bio, general area (city), and the content you post are public. Posts and listings show the neighborhood name and an
        approximate location, never your exact address. Your email address is never shown. Private messages are visible only to the people in the conversation, though they are stored unencrypted on our servers so the app can
        deliver them.
      </p>

      <h2>Service providers</h2>
      <p>We use trusted providers to run LocalVibe:</p>
      <ul>
        <li>Vercel (hosting) and MongoDB Atlas (database).</li>
        <li>Cloudinary (image storage and delivery).</li>
        <li>Resend (transactional email).</li>
        <li>OpenStreetMap / Nominatim (maps and place search). Your browser loads map tiles directly from OpenStreetMap servers.</li>
        <li>Google (only if you choose &quot;Continue with Google&quot;).</li>
      </ul>

      <h2>Cookies</h2>
      <p>We use only essential cookies to keep you signed in. Your selected neighborhood is stored in your browser&apos;s local storage. We do not use advertising or tracking cookies.</p>

      <h2>Retention</h2>
      <p>We keep your data while your account is active. Notifications are deleted automatically after 90 days and emergency alerts stop being shown after 48 hours. When you delete your account, your profile and content are permanently deleted.</p>

      <h2>Your rights</h2>
      <p>
        You can access, correct and export your data, and delete your account at any time from <strong>Settings</strong>. Depending on where you live (for example
        under GDPR or CCPA) you may have additional rights; contact us to exercise them.
      </p>

      <h2>Children</h2>
      <p>LocalVibe is not intended for children under 13. If you believe a child has created an account, please contact us and we will remove it.</p>

      <h2>Contact</h2>
      <p>Privacy questions or requests: <a href={`mailto:${email}`}>{email}</a>.</p>
    </LegalPage>
  );
}
