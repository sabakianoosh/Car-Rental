import db from '../db.js';
import {
  canTransition,
  formatIncidentCode,
  INCIDENT_TYPES,
  isValidIncidentStatus,
  isValidIncidentType,
} from '../constants/incidents.js';
import { canUserReportIncidents } from '../utils/incidentWindow.js';

function parseMetadata(row) {
  if (!row?.metadata) return {};
  try {
    return JSON.parse(row.metadata);
  } catch {
    return {};
  }
}

function enrichIncident(row) {
  if (!row) return null;
  return {
    ...row,
    metadata: parseMetadata(row),
    typeLabel: INCIDENT_TYPES[row.type]?.label || row.type,
    urgent: INCIDENT_TYPES[row.type]?.urgent || false,
  };
}

function recordStatusChange(incidentId, fromStatus, toStatus, note, actor) {
  db.prepare(`
    INSERT INTO incident_status_history (incident_id, from_status, to_status, note, actor)
    VALUES (?, ?, ?, ?, ?)
  `).run(incidentId, fromStatus, toStatus, note || null, actor || null);
}

export function getActiveRental(userId) {
  const rental = db.prepare(`
    SELECT r.*, v.name as vehicle_name, v.trim as vehicle_trim, v.color as vehicle_color,
           v.image_url as vehicle_image_url, v.fuel as vehicle_fuel, v.gear as vehicle_gear
    FROM rentals r
    JOIN vehicles v ON v.id = r.vehicle_id
    WHERE r.user_id = ? AND r.status = 'delivered'
    ORDER BY r.delivered_at DESC
    LIMIT 1
  `).get(userId);

  if (!rental) return null;

  const incidents = listIncidentsForRental(rental.id, userId);
  return {
    rental,
    incidents,
    canReportIncidents: true,
    incidentWindow: {
      active: true,
      since: rental.delivered_at,
      until: null,
      message: 'ثبت رخداد از لحظه تحویل تا بازگشت خودرو فعال است.',
    },
  };
}

export function listIncidentsForRental(rentalId, userId = null) {
  let sql = `
    SELECT i.*, r.reservation_code, v.name as vehicle_name
    FROM incidents i
    JOIN rentals r ON r.id = i.rental_id
    JOIN vehicles v ON v.id = r.vehicle_id
    WHERE i.rental_id = ?
  `;
  const params = [rentalId];
  if (userId) {
    sql += ' AND r.user_id = ?';
    params.push(userId);
  }
  sql += ' ORDER BY i.created_at DESC';
  return db.prepare(sql).all(...params).map(enrichIncident);
}

export function listUserIncidents(userId) {
  const rows = db.prepare(`
    SELECT i.*, r.reservation_code, v.name as vehicle_name
    FROM incidents i
    JOIN rentals r ON r.id = i.rental_id
    JOIN vehicles v ON v.id = r.vehicle_id
    WHERE r.user_id = ?
    ORDER BY i.created_at DESC
  `).all(userId);
  return rows.map(enrichIncident);
}

export function listAllIncidents(filters = {}) {
  let sql = `
    SELECT i.*, r.reservation_code, u.username, u.phone, v.name as vehicle_name
    FROM incidents i
    JOIN rentals r ON r.id = i.rental_id
    JOIN users u ON u.id = r.user_id
    JOIN vehicles v ON v.id = r.vehicle_id
    WHERE 1=1
  `;
  const params = [];

  if (filters.status) {
    sql += ' AND i.status = ?';
    params.push(filters.status);
  }
  if (filters.type) {
    sql += ' AND i.type = ?';
    params.push(filters.type);
  }
  if (filters.priority) {
    sql += ' AND i.priority = ?';
    params.push(filters.priority);
  }

  sql += ' ORDER BY i.created_at DESC';
  return db.prepare(sql).all(...params).map(enrichIncident);
}

export function getIncidentStats() {
  const total = db.prepare('SELECT COUNT(*) as c FROM incidents').get().c;
  const open = db.prepare(`
    SELECT COUNT(*) as c FROM incidents WHERE status NOT IN ('closed', 'settled')
  `).get().c;
  const urgent = db.prepare(`
    SELECT COUNT(*) as c FROM incidents
    WHERE priority = 'urgent' AND status NOT IN ('closed', 'settled')
  `).get().c;
  const awaiting = db.prepare(`
    SELECT COUNT(*) as c FROM incidents WHERE status = 'awaiting_decision'
  `).get().c;
  return { total, open, urgent, awaitingDecision: awaiting };
}

function getIncidentRow(id) {
  return db.prepare(`
    SELECT i.*, r.reservation_code, r.user_id, r.coverage_type, r.coverage_amount,
           u.username, u.phone, v.name as vehicle_name, v.trim as vehicle_trim
    FROM incidents i
    JOIN rentals r ON r.id = i.rental_id
    JOIN users u ON u.id = r.user_id
    JOIN vehicles v ON v.id = r.vehicle_id
    WHERE i.id = ?
  `).get(id);
}

export function getIncidentDetail(id, { userId } = {}) {
  const row = getIncidentRow(id);
  if (!row) return null;
  if (userId && row.user_id !== userId) return null;

  const history = db.prepare(`
    SELECT * FROM incident_status_history
    WHERE incident_id = ? ORDER BY created_at ASC
  `).all(id);

  const attachments = db.prepare(`
    SELECT * FROM incident_attachments WHERE incident_id = ? ORDER BY created_at ASC
  `).all(id);

  const charges = db.prepare(`
    SELECT * FROM incident_charges WHERE incident_id = ? ORDER BY created_at ASC
  `).all(id);

  const decisions = db.prepare(`
    SELECT * FROM incident_decisions WHERE incident_id = ? ORDER BY created_at ASC
  `).all(id);

  return {
    incident: enrichIncident(row),
    history,
    attachments,
    charges,
    decisions,
  };
}

export function assertActiveRentalForUser(rentalId, userId) {
  const rental = db.prepare(`
    SELECT * FROM rentals WHERE id = ? AND user_id = ?
  `).get(rentalId, userId);

  if (!rental) {
    throw new Error('رزرو یافت نشد.');
  }
  if (rental.status === 'completed') {
    throw new Error('خودرو بازگردانده شده است. دیگر نمی‌توانید رخداد جدید ثبت کنید.');
  }
  if (rental.status === 'paid') {
    throw new Error('هنوز خودرو تحویل داده نشده است. پس از تحویل در شعبه، ثبت رخداد فعال می‌شود.');
  }
  if (!canUserReportIncidents(rental)) {
    throw new Error('ثبت رخداد فقط از لحظه تحویل خودرو تا قبل از بازگشت به شعبه امکان‌پذیر است.');
  }
  return rental;
}

export function createIncident(userId, payload) {
  const {
    rentalId, type, description, location, vehicleState, metadata = {},
  } = payload;

  if (!isValidIncidentType(type)) {
    throw new Error('نوع رخداد نامعتبر است.');
  }

  assertActiveRentalForUser(rentalId, userId);

  const priority = INCIDENT_TYPES[type].urgent ? 'urgent' : 'normal';
  const metaJson = JSON.stringify(metadata);

  const info = db.prepare(`
    INSERT INTO incidents (
      rental_id, type, description, status, priority, location,
      vehicle_state, metadata, created_by, assignee
    ) VALUES (?, ?, ?, 'submitted', ?, ?, ?, ?, ?, '')
  `).run(
    rentalId,
    type,
    description || '',
    priority,
    location || null,
    vehicleState || null,
    metaJson,
    `user:${userId}`,
  );

  const id = info.lastInsertRowid;
  const code = formatIncidentCode(id);
  db.prepare('UPDATE incidents SET incident_code = ? WHERE id = ?').run(code, id);

  recordStatusChange(id, null, 'submitted', 'ثبت توسط کاربر', `user:${userId}`);

  return getIncidentDetail(id, { userId }).incident;
}

export function addIncidentAttachment(incidentId, filePath, kind = 'photo') {
  const info = db.prepare(`
    INSERT INTO incident_attachments (incident_id, file_path, kind) VALUES (?, ?, ?)
  `).run(incidentId, filePath, kind);
  return db.prepare('SELECT * FROM incident_attachments WHERE id = ?').get(info.lastInsertRowid);
}

export function updateIncidentStatus(id, newStatus, { note, actor, assignee } = {}) {
  const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);
  if (!incident) throw new Error('رخداد یافت نشد.');
  if (!isValidIncidentStatus(newStatus)) throw new Error('وضعیت نامعتبر است.');
  if (!canTransition(incident.status, newStatus)) {
    throw new Error(`انتقال از ${incident.status} به ${newStatus} مجاز نیست.`);
  }

  const resolvedAt = ['resolved', 'settled', 'closed'].includes(newStatus)
    ? (incident.resolved_at || new Date().toISOString())
    : incident.resolved_at;
  const settledAt = newStatus === 'settled' || newStatus === 'closed'
    ? (incident.settled_at || (newStatus === 'settled' ? new Date().toISOString() : incident.settled_at))
    : incident.settled_at;

  db.prepare(`
    UPDATE incidents SET
      status = ?,
      assignee = COALESCE(?, assignee),
      resolved_at = ?,
      settled_at = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(newStatus, assignee ?? null, resolvedAt, settledAt, id);

  recordStatusChange(id, incident.status, newStatus, note, actor);
  return enrichIncident(getIncidentRow(id));
}

export function addIncidentCharge(incidentId, { label, amount, chargeType, note }) {
  const info = db.prepare(`
    INSERT INTO incident_charges (incident_id, label, amount, charge_type, note)
    VALUES (?, ?, ?, ?, ?)
  `).run(incidentId, label, amount, chargeType || 'fee', note || null);
  return db.prepare('SELECT * FROM incident_charges WHERE id = ?').get(info.lastInsertRowid);
}

export function addIncidentDecision(incidentId, { decisionType, amount, note, decidedBy }) {
  const before = db.prepare('SELECT * FROM incidents WHERE id = ?').get(incidentId);
  if (!before) throw new Error('رخداد یافت نشد.');

  const info = db.prepare(`
    INSERT INTO incident_decisions (incident_id, decision_type, amount, note, decided_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(incidentId, decisionType, amount ?? null, note || null, decidedBy || null);

  const prevStatus = before.status;
  db.prepare(`
    UPDATE incidents SET status = 'settled', settled_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(incidentId);

  recordStatusChange(incidentId, prevStatus, 'settled', note, decidedBy);

  return db.prepare('SELECT * FROM incident_decisions WHERE id = ?').get(info.lastInsertRowid);
}

export function updateIncidentAdmin(id, payload) {
  const incident = db.prepare('SELECT * FROM incidents WHERE id = ?').get(id);
  if (!incident) throw new Error('رخداد یافت نشد.');

  const { status, assignee, description, note, actor } = payload;

  if (status && status !== incident.status) {
    return updateIncidentStatus(id, status, { note, actor, assignee });
  }

  db.prepare(`
    UPDATE incidents SET
      assignee = COALESCE(?, assignee),
      description = COALESCE(?, description),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(assignee ?? null, description ?? null, id);

  return enrichIncident(getIncidentRow(id));
}

export function createAdminIncident(payload) {
  const { rentalId, type, description, assignee } = payload;
  if (!isValidIncidentType(type)) throw new Error('نوع رخداد نامعتبر است.');

  const rental = db.prepare('SELECT id FROM rentals WHERE id = ?').get(rentalId);
  if (!rental) throw new Error('رزرو یافت نشد.');

  const priority = INCIDENT_TYPES[type].urgent ? 'urgent' : 'normal';
  const info = db.prepare(`
    INSERT INTO incidents (rental_id, type, description, status, priority, assignee, created_by)
    VALUES (?, ?, ?, 'under_review', ?, ?, 'admin')
  `).run(rentalId, type, description || '', priority, assignee || '');

  const id = info.lastInsertRowid;
  const code = formatIncidentCode(id);
  db.prepare('UPDATE incidents SET incident_code = ? WHERE id = ?').run(code, id);
  recordStatusChange(id, null, 'under_review', 'ثبت توسط ادمین', 'admin');

  return enrichIncident(getIncidentRow(id));
}
