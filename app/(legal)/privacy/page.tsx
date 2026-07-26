import type { Metadata } from "next";
import Link from "next/link";
import { LESSON_CONTENT_CLASSES } from "@/lib/lessonContentClasses";

export const metadata: Metadata = {
  title: "Privacy Policy — TriForge",
};

export default function PrivacyPage() {
  return (
    <main className="flex flex-1 justify-center px-6 py-12 sm:px-10">
      <div className="glass w-full max-w-3xl rounded-2xl p-8 sm:p-10">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-cyan">Legal</p>
        <h1 className="font-display text-4xl tracking-wide text-gradient">Privacy Policy</h1>
        <p className="mt-2 text-sm text-off-white/50">Last updated: July 16, 2026</p>

        <div className={`mt-8 ${LESSON_CONTENT_CLASSES}`}>
          <p>
            This Privacy Policy explains how Tri Forge Media (&ldquo;Forge,&rdquo;
            &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, and shares
            information when you visit our website, submit an application, use the TriForge
            Community platform, or otherwise engage with our creator network services.
          </p>

          <h2>Information we collect</h2>
          <p>We may collect information you provide directly, including:</p>
          <ul>
            <li>Contact details such as your name, email address, and social handles</li>
            <li>
              Application information, including TikTok account details, follower counts, LIVE
              history, and related creator metrics
            </li>
            <li>Messages or other content you send us through forms, chat, or communications</li>
            <li>
              Profile information you add on the Community platform, such as your platform, goals,
              bio, and connected social accounts
            </li>
          </ul>
          <p>
            We may also collect limited technical information automatically, such as browser type,
            device information, approximate location, and pages visited, through standard website
            analytics and cookies.
          </p>

          <h2>How we use your information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Review and process creator applications</li>
            <li>Communicate with you about your application, onboarding, and network participation</li>
            <li>Operate, maintain, and improve our website, the Community platform, and services</li>
            <li>Personalize features such as daily tasks, streaks, and XP based on your profile</li>
            <li>Comply with legal obligations and protect our rights</li>
          </ul>

          <h2>Connected accounts (e.g. TikTok)</h2>
          <p>
            If you choose to connect a third-party account, such as TikTok, we access only the
            information that account&rsquo;s platform makes available through its official API
            (for example, your display name, avatar, and public stats), and only for the purpose of
            displaying it on your Community profile. You can disconnect a linked account at any
            time from your account settings, which removes the stored tokens and cached stats.
          </p>

          <h2>How we share information</h2>
          <p>
            We do not sell your personal information. We may share information with service
            providers who help us operate our website and application systems (for example, hosting,
            email delivery, or analytics), and only as needed to perform those services. We may also
            disclose information if required by law or to protect the safety, rights, or property of
            Forge, our creators, or others.
          </p>

          <h2>Cookies and analytics</h2>
          <p>
            Our site may use cookies or similar technologies to keep you signed in and to
            understand how visitors use the site and improve performance. You can control cookies
            through your browser settings. Disabling cookies may affect some site functionality,
            including staying logged in.
          </p>

          <h2>Data retention</h2>
          <p>
            We retain application, account, and profile information for as long as needed to
            evaluate applications, manage creator relationships, operate the Community platform, and
            meet legal or operational requirements. When information is no longer needed, we take
            reasonable steps to delete or de-identify it.
          </p>

          <h2>Your choices</h2>
          <p>
            You may request access to, correction of, or deletion of personal information we hold
            about you, subject to applicable law. Many account details can be updated directly from
            your account settings. To make a broader request, contact us using the details below.
          </p>

          <h2>Children&rsquo;s privacy</h2>
          <p>
            Our services are intended for individuals 18 years of age or older. We do not knowingly
            collect personal information from anyone under 18. If you believe we have collected such
            information, please contact us so we can take appropriate action.
          </p>

          <h2>Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. The &ldquo;Last updated&rdquo; date
            at the top of this page reflects the latest revision. Continued use of our site or the
            Community platform after changes means you accept the updated policy.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about this Privacy Policy or your data can be directed to Tri Forge Media
            through our application page or via our TikTok presence at @forge_live_cn.
          </p>
        </div>

        <p className="mt-10 text-sm text-off-white/50">
          <Link href="/terms" className="text-cyan hover:underline">
            Terms &amp; Conditions
          </Link>
          {" · "}
          <Link href="/" className="text-cyan hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
