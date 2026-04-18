import { useState } from 'react';
import { useI18n } from '../i18n';

export default function ProjectForm({ project, onSave, onCancel }) {
  const { t } = useI18n();
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    location: project?.location || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">{t('projectName')}</label>
        <input className="form-input" value={form.name}
          onChange={e => set('name', e.target.value)} required placeholder="Highway 101 Bridge" />
      </div>
      <div className="form-group">
        <label className="form-label">{t('location')}</label>
        <input className="form-input" value={form.location}
          onChange={e => set('location', e.target.value)} placeholder="San Francisco, CA" />
      </div>
      <div className="form-group">
        <label className="form-label">{t('description')}</label>
        <textarea className="form-textarea" value={form.description}
          onChange={e => set('description', e.target.value)} rows={2} />
      </div>
      <div className="btn-group" style={{ marginTop: 8 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>{t('cancel')}</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? '…' : t('save')}
        </button>
      </div>
    </form>
  );
}
