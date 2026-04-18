import { useState } from 'react';
import { useI18n } from '../i18n';

export default function EntryForm({ entry, projects, onSave, onCancel, onDelete }) {
  const { t } = useI18n();
  const isEdit = !!entry?.id;

  const [form, setForm] = useState({
    worker_name: entry?.worker_name || '',
    date: entry?.date || new Date().toISOString().slice(0, 10),
    hours: entry?.hours ?? '',
    project_id: entry?.project_id || '',
    task_description: entry?.task_description || '',
    overtime: entry?.overtime ?? 0,
    notes: entry?.notes || '',
  });

  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        hours: parseFloat(form.hours) || 0,
        overtime: parseFloat(form.overtime) || 0,
        project_id: parseInt(form.project_id),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">{t('workerName')}</label>
        <input className="form-input" value={form.worker_name}
          onChange={e => set('worker_name', e.target.value)} required placeholder="John Doe" />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('date')}</label>
          <input className="form-input" type="date" value={form.date}
            onChange={e => set('date', e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label">{t('project')}</label>
          <select className="form-select" value={form.project_id}
            onChange={e => set('project_id', e.target.value)} required>
            <option value="">{t('selectProject')}</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('hours')}</label>
          <input className="form-input" type="number" step="0.25" min="0" max="24"
            value={form.hours} onChange={e => set('hours', e.target.value)} required placeholder="8" />
        </div>
        <div className="form-group">
          <label className="form-label">{t('overtime')}</label>
          <input className="form-input" type="number" step="0.25" min="0" max="24"
            value={form.overtime} onChange={e => set('overtime', e.target.value)} placeholder="0" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">{t('taskDescription')}</label>
        <input className="form-input" value={form.task_description}
          onChange={e => set('task_description', e.target.value)} placeholder="Framing, electrical…" />
      </div>

      <div className="form-group">
        <label className="form-label">{t('notes')}</label>
        <textarea className="form-textarea" value={form.notes}
          onChange={e => set('notes', e.target.value)} rows={2} placeholder="…" />
      </div>

      <div className="btn-group" style={{ marginTop: 8 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          {t('cancel')}
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? '…' : t('save')}
        </button>
      </div>

      {isEdit && onDelete && (
        <div style={{ marginTop: 12 }}>
          {confirmingDelete ? (
            <div className="btn-group">
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmingDelete(false)}>
                {t('cancel')}
              </button>
              <button type="button" className="btn btn-danger" onClick={() => onDelete(entry.id)}>
                {t('confirmDelete')}
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-danger btn-block" onClick={() => setConfirmingDelete(true)}>
              {t('delete')}
            </button>
          )}
        </div>
      )}
    </form>
  );
}
