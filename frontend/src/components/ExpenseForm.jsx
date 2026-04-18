import { useState } from 'react';
import { useI18n } from '../i18n';

export default function ExpenseForm({ expense, projects, workers, categories, stores, onSave, onCancel, onDelete }) {
  const { t } = useI18n();
  const isEdit = !!expense?.id;

  const [form, setForm] = useState({
    worker_name: expense?.worker_name || '',
    date: expense?.date || new Date().toISOString().slice(0, 10),
    project_id: expense?.project_id || '',
    amount: expense?.amount ?? '',
    category: expense?.category || 'Materials',
    store: expense?.store || '',
    description: expense?.description || '',
    receipt_ref: expense?.receipt_ref || '',
    notes: expense?.notes || '',
  });

  const [customStore, setCustomStore] = useState(false);
  const [customWorker, setCustomWorker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const workerInList = workers.some(w => w.name === form.worker_name);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        amount: parseFloat(form.amount) || 0,
        project_id: parseInt(form.project_id),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Worker */}
      <div className="form-group">
        <label className="form-label">{t('workerName')}</label>
        {!customWorker && workers.length > 0 ? (
          <select className="form-select"
            value={workerInList ? form.worker_name : ''}
            onChange={e => {
              if (e.target.value === '__custom__') { setCustomWorker(true); set('worker_name', ''); }
              else set('worker_name', e.target.value);
            }} required={!form.worker_name}>
            <option value="">{t('selectWorker')}</option>
            {workers.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
            <option value="__custom__">+ Type name…</option>
          </select>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="form-input" value={form.worker_name}
              onChange={e => set('worker_name', e.target.value)} required placeholder="Name" style={{ flex: 1 }} />
            {workers.length > 0 && (
              <button type="button" className="btn btn-ghost" onClick={() => setCustomWorker(false)} style={{ fontSize: 13 }}>← List</button>
            )}
          </div>
        )}
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
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('amount')}</label>
          <input className="form-input" type="number" step="0.01" min="0"
            value={form.amount} onChange={e => set('amount', e.target.value)} required placeholder="0.00" />
        </div>
        <div className="form-group">
          <label className="form-label">{t('category')}</label>
          <select className="form-select" value={form.category}
            onChange={e => set('category', e.target.value)} required>
            {(categories || []).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Store */}
      <div className="form-group">
        <label className="form-label">{t('store')}</label>
        {!customStore ? (
          <select className="form-select" value={stores?.includes(form.store) ? form.store : (form.store ? '__custom__' : '')}
            onChange={e => {
              if (e.target.value === '__custom__') { setCustomStore(true); set('store', ''); }
              else set('store', e.target.value);
            }}>
            <option value="">— optional —</option>
            {(stores || []).map(s => <option key={s} value={s}>{s}</option>)}
            <option value="__custom__">+ Type store…</option>
          </select>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="form-input" value={form.store}
              onChange={e => set('store', e.target.value)} placeholder="Store name" style={{ flex: 1 }} />
            <button type="button" className="btn btn-ghost" onClick={() => setCustomStore(false)} style={{ fontSize: 13 }}>← List</button>
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">{t('description')}</label>
        <input className="form-input" value={form.description}
          onChange={e => set('description', e.target.value)} placeholder="2x4 lumber, screws, etc." />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">{t('receiptRef')}</label>
          <input className="form-input" value={form.receipt_ref}
            onChange={e => set('receipt_ref', e.target.value)} placeholder="Receipt #" />
        </div>
        <div className="form-group">
          <label className="form-label">{t('notes')}</label>
          <input className="form-input" value={form.notes}
            onChange={e => set('notes', e.target.value)} placeholder="…" />
        </div>
      </div>

      <div className="btn-group" style={{ marginTop: 8 }}>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>{t('cancel')}</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? '…' : t('save')}
        </button>
      </div>

      {isEdit && onDelete && (
        <div style={{ marginTop: 12 }}>
          {confirmingDelete ? (
            <div className="btn-group">
              <button type="button" className="btn btn-secondary" onClick={() => setConfirmingDelete(false)}>{t('cancel')}</button>
              <button type="button" className="btn btn-danger" onClick={() => onDelete(expense.id)}>{t('confirmDelete')}</button>
            </div>
          ) : (
            <button type="button" className="btn btn-danger btn-block" onClick={() => setConfirmingDelete(true)}>{t('delete')}</button>
          )}
        </div>
      )}
    </form>
  );
}
