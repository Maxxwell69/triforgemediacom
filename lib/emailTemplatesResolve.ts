import "server-only";

import { prisma } from "@/lib/prisma";
import {
  getTemplateDef,
  renderTemplateContent,
  type EmailTemplateKey,
  type TemplateVars,
} from "@/lib/emailTemplates";
import type { EmailContent } from "@/lib/emailLayout";

export async function resolveEditableEmail(
  key: EmailTemplateKey,
  vars: TemplateVars,
  fallback: () => EmailContent
): Promise<EmailContent> {
  const def = getTemplateDef(key);
  if (!def) return fallback();

  const row = await prisma.emailTemplate.findUnique({ where: { key } });
  if (!row) return fallback();

  return renderTemplateContent(def, row.subject, row.bodyHtml, row.wrapsInLayout, vars);
}
