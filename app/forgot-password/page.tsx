import ForgotPasswordForm from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-3 text-center font-display text-4xl tracking-wide">
          RESET <span className="text-gradient">PASSWORD</span>
        </h1>
        <p className="mb-8 text-center font-body text-sm text-off-white/50">
          Enter your email and we&apos;ll send you a reset link.
        </p>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
