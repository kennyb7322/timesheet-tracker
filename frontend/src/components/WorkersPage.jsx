import { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import { getWorkers, createWorker, updateWorker, deleteWorker } from '../api/client';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

export default function WorkersPage() {
  const { t } = useI18n();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editW, setEditW] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({ name: '', role: '', phone: '' });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const load = async () => {
    setLoading(true);
    const data = await getWorkers(!showInactive);
    setWorkers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [showInactive]);

  const openNew = () => { setEditW(null); setForm({ name: '', role: '', phone: '' }); setModalOpen(true); };
  const openEdit = (w) => { setEditW(w); setForm({ name: w.name, role: w.role, phone: w.phone }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editW?.id) {
      await updateWorker(editW.id, form);
    } else {
      await createWorker(form);
    }
    setModalOpen(false);
    setToast({ msg: t('save') + ' ✓', type: 'success' });
    load();
  };

  const handleArchive = async (w) => {
    await deleteWorker(w.id);
    setModalOpen(false);
    setToast({ msg: t('inactive') + ' ✓', type: 'success' });
    load();
  };

  return (
    <div className="page">
      {toast && <Toast key={Date.now()} message={toast.msg} type={toast.type} />}

      <div className="filter-bar">
        <button className={`filter-chip ${!showInactive ? 'active' : ''}`}
          onClick={() => setShowInactive(false)}>{t('active')}</button>
        <button className={`filter-chip ${showInactive ? 'active' : ''}`}
          onClick={() => setShowInactive(true)}>{t('inactive')}</button>
      </div>

      {loading ? (
        <div className="empty-state"><p>{t('loadingData')}</p></div>
      ) : workers.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 48, height: 48, opacity: 0.5 }}>
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          <p>{t('noWorkers')}</p>
        </div>
      ) : (
        workers.map(w => (
          <div key={w.id} className="card" onClick={() => openEdit(w)} style={{ cursor: 'pointer' }}>
            <div className="card-row">
              <div>
                <div className="card-title">{w.name}</div>
                {w.role && <div className="card-subtitle">{w.role}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                {w.phone && <div className="card-value" style={{ fontSize: 13 }}>{w.phone}</div>}
                <span className={`badge ${w.is_active ? 'active' : 'inactive'}`}>
                  {w.is_active ? t('active') : t('inactive')}
                </span>
              </div>
            </div>
          </div>
        ))
      )}

      <button className="fab" onClick={openNew}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      <Modal open={modalOpen} title={editW ? t('editWorker') : t('addWorker')}
        onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">{t('workerName')}</label>
            <input className="form-input" value={form.name}
              onChange={e => set('name', e.target.value)} required placeholder="John Doe" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('role')}</label>
            <input className="form-input" value={form.role}
              onChange={e => set('role', e.target.value)} placeholder="Carpenter, Electrician…" />
          </div>
          <div className="form-group">
            <label className="form-label">{t('phone')}</label>
            <input className="form-input" type="tel" value={form.phone}
              onChange={e => set('phone', e.target.value)} placeholder="(555) 123-4567" />
          </div>
          <div className="btn-group" style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              {t('cancel')}
            </button>
            <button type="submit" className="btn btn-primary">{t('save')}</button>
          </div>
          {editW?.is_active === 1 && (
            <button type="button" className="btn btn-danger btn-block" style={{ marginTop: 12 }}
              onClick={() => handleArchive(editW)}>
              {t('delete')}
            </button>
          )}
        </form>
      </Modal>
    </div>
  );
}
