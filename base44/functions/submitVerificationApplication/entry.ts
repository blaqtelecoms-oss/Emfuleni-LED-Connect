import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const applicationId = body?.applicationId;
    const ownerIdNumber = body?.owner_id_number;
    const consent = !!body?.consent;
    const declaration = !!body?.declaration;
    const signatureName = body?.signature_name;

    if (!applicationId) return Response.json({ error: 'Application id required' }, { status: 400 });
    if (!consent || !declaration || !signatureName) return Response.json({ error: 'Consent, declaration and signature are required' }, { status: 400 });
    if (!ownerIdNumber) return Response.json({ error: 'Owner ID number is required' }, { status: 400 });

    const app = await base44.asServiceRole.entities.VerificationApplication.get(applicationId).catch(() => null);
    if (!app) return Response.json({ error: 'Application not found' }, { status: 404 });
    if (app.created_by_id !== user.id && user.role !== 'admin') return Response.json({ error: 'Not your application' }, { status: 403 });
    if (app.status && app.status !== 'draft') return Response.json({ error: 'Application already submitted' }, { status: 400 });

    const biz = await base44.asServiceRole.entities.Business.get(app.business).catch(() => null);
    if (!biz) return Response.json({ error: 'Business not found' }, { status: 404 });

    // Compute required document rules for this business
    const rules = await base44.asServiceRole.entities.DocumentRule.filter({ active: true });
    const required = rules.filter((r) => r.requirement_level === 'required' && ruleApplies(r, biz));

    // Document uploads are optional for now — skip the required-missing check
    const docs = await base44.asServiceRole.entities.BusinessDocument.filter({ application: applicationId });
    const docByType = {};
    docs.forEach((d) => {
      if (!docByType[d.document_type] || (d.version || 1) > (docByType[d.document_type].version || 0)) docByType[d.document_type] = d;
    });
    const _missing = required.filter((r) => !docByType[r.document_type]);

    // Generate sequential reference VA-YYYY-XXXX
    const year = new Date().getFullYear();
    const prefix = `VA-${year}-`;
    const all = await base44.asServiceRole.entities.VerificationApplication.filter({});
    const seq = all.filter((a) => (a.reference || '').startsWith(prefix)).length + 1;
    const reference = `${prefix}${String(seq).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const updated = await base44.asServiceRole.entities.VerificationApplication.update(applicationId, {
      status: 'submitted',
      reference,
      submitted_at: now,
      owner_id_number: ownerIdNumber,
      consent_at: app.consent_at || now,
      declaration_at: app.declaration_at || now,
      signature_name: signatureName,
    });

    await base44.asServiceRole.entities.Business.update(app.business, { status: 'pending' }).catch(() => {});

    await base44.asServiceRole.entities.VerificationLog.create({
      application: applicationId,
      actor: user.id,
      action: 'submitted',
      detail: `Application ${reference} submitted by ${user.full_name || user.email}`,
    }).catch(() => {});

    await base44.asServiceRole.entities.InboxItem.create({
      recipient: user.id,
      kind: 'message',
      title: 'Verification application submitted',
      body: `Your application ${reference} has been submitted. An LED officer will review it. We will notify you when the status changes.`,
      sender: 'Emfuleni LED Office',
    }).catch(() => {});

    await base44.asServiceRole.entities.NotificationLog.create({
      recipient: user.id,
      channel: 'app',
      template: 'application_submitted',
      body: `Verification application ${reference} submitted.`,
      status: 'queued (stub)',
    }).catch(() => {});

    return Response.json({ ok: true, reference, application: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function ruleApplies(rule, biz) {
  const c = rule.conditions || {};
  const keys = Object.keys(c);
  if (keys.length === 0) return true;
  for (const k of keys) {
    const allowed = Array.isArray(c[k]) ? c[k] : [c[k]];
    const val = biz ? biz[k] : undefined;
    if (Array.isArray(val)) {
      if (!val.some((v) => allowed.includes(v))) return false;
    } else if (!allowed.includes(val)) {
      return false;
    }
  }
  return true;
}