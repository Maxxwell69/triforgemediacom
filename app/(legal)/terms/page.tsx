import type { Metadata } from "next";
import Link from "next/link";
import { LESSON_CONTENT_CLASSES } from "@/lib/lessonContentClasses";

export const metadata: Metadata = {
  title: "Terms & Conditions — TriForge",
};

export default function TermsPage() {
  return (
    <main className="flex flex-1 justify-center px-6 py-12 sm:px-10">
      <div className="glass w-full max-w-3xl rounded-2xl p-8 sm:p-10">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-cyan">Legal</p>
        <h1 className="font-display text-4xl tracking-wide text-gradient">Terms &amp; Conditions</h1>
        <p className="mt-2 text-sm text-off-white/50">Last updated: July 16, 2026</p>

        <div className={`mt-8 ${LESSON_CONTENT_CLASSES}`}>
          <p>
            These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your access to and use of the
            Tri Forge Media website, the TriForge Community platform, and related services (the
            &ldquo;Services&rdquo;). By using our site, submitting an application, or using the
            Community platform, you agree to these Terms. If you do not agree, do not use the
            Services.
          </p>

          <h2>Who we are</h2>
          <p>
            Tri Forge Media (&ldquo;Forge,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
            &ldquo;our&rdquo;) operates a TikTok LIVE creator network that supports qualifying
            creators with training, community, and growth-focused resources. These Terms apply to
            website visitors, applicants, and members of the TriForge Community platform. Separate
            agreements may apply if you are accepted into the network.
          </p>

          <h2>Eligibility</h2>
          <p>
            You must be at least 18 years old and able to form a binding agreement to use the
            Services or apply to the network. Creators applying to join must meet our published
            requirements, including location, account, content, and LIVE commitment standards,
            which we may update from time to time.
          </p>

          <h2>Applications</h2>
          <p>
            Submitting an application does not guarantee acceptance. We review applications at our
            discretion and may accept, decline, or request additional information without
            obligation to explain every decision. You agree that information you provide is
            accurate and that the TikTok account you submit is your main account.
          </p>

          <h2>Acceptable use</h2>
          <p>When using our website, the Community platform, or our Services, you agree not to:</p>
          <ul>
            <li>Provide false, misleading, or incomplete information</li>
            <li>Attempt to interfere with the security or operation of the site</li>
            <li>
              Use the Services for any unlawful purpose or in violation of TikTok&rsquo;s community
              guidelines or applicable law
            </li>
            <li>
              Misrepresent your affiliation with Forge or claim acceptance before you have been
              officially onboarded
            </li>
            <li>Harass, abuse, or harm other members, or post content that violates community standards</li>
          </ul>

          <h2>Creator conduct</h2>
          <p>
            If you join the network, you are expected to maintain professional LIVE standards,
            follow platform guidelines, and meet any LIVE activity commitments communicated during
            onboarding. Forge may remove creators from the network or the Community platform for
            guideline violations, inactivity, misrepresentation, or conduct that harms the network
            or its creators.
          </p>

          <h2>No fees from creators</h2>
          <p>
            Joining Forge does not require creators to pay Forge for membership. Agency economics
            are structured separately from creator diamond earnings as described in our public
            materials. Nothing on this site constitutes a guarantee of earnings, growth, or
            campaign placement.
          </p>

          <h2>Intellectual property</h2>
          <p>
            Site content, branding, logos, and related materials are owned by Forge or our
            licensors and may not be copied, modified, or used without prior written permission,
            except for personal, non-commercial viewing of the site.
          </p>

          <h2>Third-party platforms</h2>
          <p>
            Our Services relate to TikTok and may reference other third-party platforms. Those
            platforms have their own terms and policies. Forge is not responsible for third-party
            platform decisions, restrictions, bans, algorithm changes, or payouts.
          </p>

          <h2>Disclaimer</h2>
          <p>
            The Services are provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo; To the
            fullest extent permitted by law, we disclaim warranties of merchantability, fitness for
            a particular purpose, and non-infringement. We do not warrant that the site will be
            uninterrupted or error-free.
          </p>

          <h2>Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, Forge and its officers, affiliates, and
            partners will not be liable for indirect, incidental, special, consequential, or
            punitive damages, or any loss of profits, data, or goodwill, arising from your use of
            the Services or inability to use them.
          </p>

          <h2>Changes to these Terms</h2>
          <p>
            We may update these Terms from time to time. The &ldquo;Last updated&rdquo; date at the
            top of this page reflects the latest revision. Continued use of the Services after
            changes means you accept the updated Terms.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about these Terms can be directed to Tri Forge Media through our application
            page or via our TikTok presence at @forge_live_cn.
          </p>
        </div>

        <p className="mt-10 text-sm text-off-white/50">
          <Link href="/privacy" className="text-cyan hover:underline">
            Privacy Policy
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
