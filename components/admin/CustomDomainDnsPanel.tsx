import CopyField from "@/components/admin/CopyField";
import {
  dnsRegistrarName,
  humanizeRailwayStatus,
  type CustomDomainSetup,
} from "@/lib/hub/customDomain";

export default function CustomDomainDnsPanel({
  setup,
  httpsReady,
  refreshAction,
}: {
  setup: CustomDomainSetup;
  httpsReady: boolean;
  refreshAction: () => Promise<void>;
}) {
  const zone =
    setup.host.split(".").length <= 2
      ? setup.host
      : setup.host.split(".").slice(-2).join(".");
  const cnameName = dnsRegistrarName(setup.cnameHost || setup.host, setup.host);
  const txtName = setup.txtHost ? dnsRegistrarName(setup.txtHost, setup.host) : null;
  const cert = humanizeRailwayStatus(setup.certificateStatus);
  const dns = humanizeRailwayStatus(setup.dnsStatus);

  return (
    <div className="glass mt-4 flex flex-col gap-5 rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-body text-[11px] uppercase tracking-wide text-off-white/35">
            DNS at your registrar
          </p>
          <h2 className="mt-1 font-display text-2xl tracking-wide">
            {httpsReady ? "HTTPS IS LIVE" : "ADD THESE TWO RECORDS"}
          </h2>
          <p className="mt-2 max-w-xl font-body text-sm text-off-white/55">
            Copy Type, Name, and Value into GoDaddy, Namecheap, or Cloudflare. Name is
            only the left part — they already add{" "}
            <span className="text-off-white/80">.{zone}</span>. Do not paste the whole
            line into Value.
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

      {setup.cnameTarget ? (
        <DnsRecordCard
          step="1"
          type="CNAME"
          name={cnameName}
          value={setup.cnameTarget.replace(/\.$/, "")}
          hint={
            cnameName === "@"
              ? "Root domain: use ALIAS, ANAME, or CNAME flattening if your registrar has no CNAME on @."
              : `This makes ${setup.host} point at Railway.`
          }
        />
      ) : (
        <p className="font-body text-xs text-off-white/45">
          Save the hostname above so Railway can generate the CNAME target.
        </p>
      )}

      {txtName && setup.txtValue ? (
        <DnsRecordCard
          step="2"
          type="TXT"
          name={txtName}
          value={setup.txtValue}
          hint="Required for ownership. If you use Cloudflare, set both records to DNS only (grey cloud)."
        />
      ) : null}
    </div>
  );
}

function DnsRecordCard({
  step,
  type,
  name,
  value,
  hint,
}: {
  step: string;
  type: string;
  name: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-off-white/15 bg-charcoal/40 p-4">
      <p className="font-body text-[11px] uppercase tracking-wide text-cyan">
        Record {step} of 2 · {type}
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
