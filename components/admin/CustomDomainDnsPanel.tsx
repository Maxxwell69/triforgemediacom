import CopyField from "@/components/admin/CopyField";
import {
  customDomainDnsRecords,
  dnsRegistrarName,
  humanizeRailwayStatus,
  type CustomDomainSetup,
} from "@/lib/hub/customDomain";

export default function CustomDomainDnsPanel({
  setup,
  httpsReady,
  dnsActive,
  refreshAction,
}: {
  setup: CustomDomainSetup;
  httpsReady: boolean;
  dnsActive?: boolean;
  refreshAction: () => Promise<void>;
}) {
  const zone =
    setup.host.split(".").length <= 2
      ? setup.host
      : setup.host.split(".").slice(-2).join(".");
  const records = customDomainDnsRecords(setup);
  const cert = humanizeRailwayStatus(setup.certificateStatus);
  const dns = humanizeRailwayStatus(setup.dnsStatus);
  const cloudflare = setup.provider === "cloudflare" || !setup.railwayId;

  return (
    <div className="glass mt-4 flex flex-col gap-5 rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-body text-[11px] uppercase tracking-wide text-off-white/35">
            DNS at your registrar
          </p>
          <h2 className="mt-1 font-display text-2xl tracking-wide">
            {httpsReady ? "HTTPS IS LIVE" : dnsActive ? "KEEP THESE RECORDS" : "ADD THESE RECORDS"}
          </h2>
          <p className="mt-2 max-w-xl font-body text-sm text-off-white/55">
            {dnsActive && !httpsReady
              ? "DNS is already in. These are the original records we sent — do not replace them if a status check shows new tokens."
              : `Copy Type, Name, and Value into the DNS for .${zone}. Name is only the left part. This hub is identified by hostname — ${setup.host} always loads this community, not Hub 0.`}
          </p>
        </div>
        <form action={refreshAction}>
          <button
            type="submit"
            className="rounded-lg border border-cyan/40 px-3 py-1.5 font-body text-xs text-cyan hover:border-cyan/70"
          >
            Check HTTPS status
          </button>
        </form>
      </div>

      {cert || dns ? (
        <p className="font-body text-xs text-off-white/45">
          Certificate: {cert || "pending"}
          {dns ? ` · DNS: ${dns}` : ""}
        </p>
      ) : null}

      {records.length === 0 ? (
        <p className="font-body text-xs text-off-white/45">
          Save the hostname above so DNS records can be generated.
        </p>
      ) : (
        records.map((record, index) => (
          <DnsRecordCard
            key={`${record.type}-${record.host}-${record.value}-${index}`}
            step={String(index + 1)}
            total={String(records.length)}
            type={record.type}
            name={dnsRegistrarName(record.host, setup.host)}
            value={record.value}
            hint={
              record.type === "CNAME"
                ? cloudflare
                  ? `This makes ${setup.host} point at ${record.value} so Cloudflare can issue HTTPS.`
                  : `This makes ${setup.host} point at Railway.`
                : dnsActive
                  ? "Leave this TXT as first sent. New values after a status check are Cloudflare rotating — do not update DNS."
                  : "Ownership / certificate check. Same name can appear twice with different values."
            }
          />
        ))
      )}
    </div>
  );
}

function DnsRecordCard({
  step,
  total,
  type,
  name,
  value,
  hint,
}: {
  step: string;
  total: string;
  type: string;
  name: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-off-white/15 bg-charcoal/40 p-4">
      <p className="font-body text-[11px] uppercase tracking-wide text-cyan">
        Record {step} of {total} · {type}
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <CopyField label="Type" value={type} />
        <CopyField label="Name / Host" value={name} />
        <div className="sm:col-span-2">
          <CopyField label="Value / Points to" value={value} />
        </div>
      </div>
      <p className="mt-3 font-body text-xs text-off-white/45">{hint}</p>
    </div>
  );
}
