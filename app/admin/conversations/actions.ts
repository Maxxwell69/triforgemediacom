"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminPage } from "@/lib/session";
import { isAdminRole } from "@/lib/rbac";
import { getRequestHubContext } from "@/lib/hub/requestPrisma";
import {
  findOrCreateOutreachConversation,
  requireConversationsModule,
  setOutreachClosed,
} from "@/lib/conversations";
import { saveClientHubResendSettings } from "@/lib/hub/resendSettings";

async function requireConversationsAdmin() {
  requireConversationsModule();
  const user = await requireAdminPage();
  if (!isAdminRole(user.role)) {
    throw new Error("Staff only.");
  }
  return user;
}

export async function startConversationAction(formData: FormData) {
  const user = await requireConversationsAdmin();
  const memberId = String(formData.get("memberId") || "").trim();
  if (!memberId) {
    redirect("/admin/conversations?error=pick");
  }
  let conversationId: string;
  try {
    conversationId = await findOrCreateOutreachConversation(user.id, memberId);
  } catch (err) {
    console.error("startConversationAction", err);
    redirect("/admin/conversations?error=start");
  }
  revalidatePath("/admin/conversations");
  redirect(`/admin/conversations/${conversationId}`);
}

export async function setConversationClosedAction(formData: FormData) {
  const user = await requireConversationsAdmin();
  const conversationId = String(formData.get("conversationId") || "").trim();
  const closed = String(formData.get("closed") || "") === "1";
  if (!conversationId) {
    redirect("/admin/conversations");
  }
  await setOutreachClosed(conversationId, user.id, closed);
  revalidatePath("/admin/conversations");
  revalidatePath(`/admin/conversations/${conversationId}`);
  redirect(`/admin/conversations/${conversationId}`);
}

export async function saveConversationSendingAction(formData: FormData) {
  await requireConversationsAdmin();
  const ctx = await getRequestHubContext();
  if (ctx.kind !== "client" && ctx.kind !== "client-unprovisioned") {
    redirect("/admin/conversations/settings");
  }
  try {
    await saveClientHubResendSettings({
      hubId: ctx.hub.id,
      apiKey: String(formData.get("apiKey") || ""),
      fromEmail: String(formData.get("fromEmail") || ""),
      domainReady: formData.get("domainReady") === "on",
      clearKey: formData.get("clearKey") === "1",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't save.";
    redirect(`/admin/conversations/settings?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/admin/conversations/settings");
  redirect("/admin/conversations/settings?saved=1");
}
