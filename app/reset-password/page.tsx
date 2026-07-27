import Link from "next/link";
import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;

  if (!token) {
    return (
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="glass max-w-md rounded-2xl p-10 text-center">
          <h1 className="font-display text-4xl tracking-wide text-orange">INVALID LINK</h1>
          <p className="mt-4 font-body text-off-white/70">
            This password reset link is missing its token.
          </p>
          <Link
            href="/forgot-password"
            className="mt-8 inline-block rounded-lg border border-off-white/15 px-6 py-2 font-body text-off-white/90 transition hover:border-cyan/50 hover:text-cyan"
          >
            Request a new link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center font-display text-5xl tracking-wide">
          NEW <span className="text-gradient">PASSWORD</span>
        </h1>
        <ResetPasswordForm token={token} />
      </div>
    </main>
  );
}
