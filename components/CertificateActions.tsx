"use client";

export default function CertificateActions() {
  return (
    <div className="mt-6 flex justify-center gap-3 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-lg bg-orange px-6 py-2.5 font-body font-semibold text-off-white shadow-glow transition hover:brightness-110"
      >
        Print / Save as PDF
      </button>
    </div>
  );
}
