import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/session";
import { requireShopModule } from "@/lib/shop/catalog";

export const dynamic = "force-dynamic";

export default async function ShopDownloadsPage() {
  requireShopModule();
  const { user } = await requireProfile();
  const grants = await prisma.shopDownloadGrant.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: {
          title: true,
          files: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/shop" className="font-body text-sm text-off-white/50 transition hover:text-cyan">
          ← Shop
        </Link>
        <h1 className="mt-4 font-display text-5xl tracking-wide">
          YOUR <span className="text-gradient">DOWNLOADS</span>
        </h1>
        <p className="mt-2 font-body text-off-white/60">
          Files you bought. Links expire quickly — tap again if a download fails.
        </p>

        {grants.length === 0 ? (
          <p className="glass mt-8 rounded-2xl p-8 text-center font-body text-off-white/50">
            No digital purchases yet.
          </p>
        ) : (
          <div className="mt-8 flex flex-col gap-3">
            {grants.map((grant) => (
              <div key={grant.id} className="glass rounded-2xl p-5">
                <p className="font-body font-semibold text-off-white">{grant.product.title}</p>
                <ul className="mt-3 flex flex-col gap-2">
                  {grant.product.files.length === 0 ? (
                    <li className="font-body text-sm text-off-white/45">Files have not been attached yet.</li>
                  ) : (
                    grant.product.files.map((file) => (
                      <li key={file.id}>
                        <a
                          href={`/api/shop/downloads/${grant.id}/${file.id}`}
                          className="font-body text-sm text-cyan transition hover:underline"
                        >
                          {file.fileName}
                        </a>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
