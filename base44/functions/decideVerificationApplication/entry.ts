import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const VALID_ACTIONS = ['in_review', 'incomplete', 'verified', 'declined'];

const ACTION_LABEL = {
  in_review: 'review started',
  incomplete: 'marked incomplete',
  verified: 'verified',
  declined: 'declined',
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Only LED officers can decide applications' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const applicationId = body?.applicationId;
    const action = body?.action;
    const note = (body?.note || '').toString().trim();

    if (!applicationId) return Response.json({ error: 'Application id required' }, { status: 400 });
    if (!VALID_ACTIONS.includes(action)) return Response.json({ error: 'Invalid action' }, { status: 400 });
    if ((action === 'incomplete' || action === 'declined') && !note) {
      return Response.json({ error: 'A note is required for this decision' }, { status: 400 });
    }

    const app = await base44.asServiceRole.entities.VerificationApplication.get(applicationId).catch(() => null);
    if (!app) return Response.json({ error: 'Application not found' }, { status: 404 });
    if (app.status === 'verified' || app.status === 'declined') {
      return Response.json({ error: 'Application already decided' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const bizId = app.business;

    const appUpdate = { status: action };
    if (action === 'in_review') appUpdate.assigned_to = user.id;
    if (action === 'incomplete') {
      appUpdate.decision_reason = 'incomplete';
      appUpdate.decision_note = note;
    }
    if (action === 'verified' || action === 'declined') {
      appUpdate.decided_by = user.id;
      appUpdate.decided_at = now;
      appUpdate.decision_note = note;
      if (action === 'declined') appUpdate.decision_reason = 'declined';
    }

    const updated = await base44.asServiceRole.entities.VerificationApplication.update(applicationId, appUpdate);

    if (action === 'verified') {
      await base44.asServiceRole.entities.Business.update(bizId, {
        status: 'verified',
        verified_by: user.id,
        verified_at: now,
      }).catch(() => {});
      const docs = await base44.asServiceRole.entities.BusinessDocument.filter({ application: applicationId });
      for (const d of docs) {
        if (d.status !== 'approved') {
          await base44.asServiceRole.entities.BusinessDocument.update(d.id, {
            status: 'approved',
            reviewed_by: user.id,
            reviewed_at: now,
            reviewer_note: note || 'Approved on verification',
          }).catch(() => {});
        }
      }
    } else if (action === 'declined') {
      await base44.asServiceRole.entities.Business.update(bizId, {
        status: 'declined',
        verified_by: null,
        verified_at: null,
      }).catch(() => {});
    }

    await base44.asServiceRole.entities.VerificationLog.create({
      application: applicationId,
      actor: user.id,
      action,
      detail: `${ACTION_LABEL[action]} by ${user.full_name || user.email}${note ? ` — ${note}` : ''}`,
    }).catch(() => {});

    const biz = await base44.asServiceRole.entities.Business.get(bizId).catch(() => null);
    const recipient = biz?.owner || app.created_by_id;
    const messages = {
      in_review: { title: 'Application under review', body: 'Your verification application is now under review by an LED officer.' },
      incomplete: { title: 'More information needed', body: `Your application needs more detail: ${note}` },
      verified: { title: 'Your business is verified', body: 'Congratulations! Your business is now verified and visible in the local directory.' },
      declined: { title: 'Application declined', body: `Your verification application was declined: ${note}` },
    }[action];
    if (recipient) {
      await base44.asServiceRole.entities.InboxItem.create({
        recipient,
        kind: 'message',
        title: messages.title,
        body: messages.body,
        sender: 'Emfuleni LED Office',
      }).catch(() => {});
      await base44.asServiceRole.entities.NotificationLog.create({
        recipient,
        channel: 'app',
        template: `application_${action}`,
        body: messages.title,
        status: 'queued (stub)',
      }).catch(() => {});
    }

    return Response.json({ ok: true, application: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}