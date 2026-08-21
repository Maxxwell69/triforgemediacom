import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy progression lesson shells were replaced by Learning Center courses. */
export default function ProgressLearnPage() {
  redirect("/progress");
}
