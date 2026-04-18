import { useState, useEffect, useMemo } from 'react';
import { useI18n } from '../i18n';
import { getEntries, getProjects, createEntry, updateEntry, deleteEntry } from '../api/client';
import EntryForm from '../components/EntryForm';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

// Icons
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const FilterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

export default function EntriesPage() {
  const { t } = useI18n();
  const [entries, setEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [toast, setToast] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ worker_name: '', project_id: '', start_date: '', end_date: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [e, p] = await Promise.all([getEntries(filters), getProjects()]);
      setEntries(e);
      setProjects(p);
    } catch {
      setToast({ msg: 'Failed to load', type: 'error' });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filters]);

  const stats = useMemo(() => {
    const totalHrs = entries.reduce((s, e) => s + e.hours, 0);
    const totalOT = entries.reduce((s, e) => s + e.overtime, 0);
    const workers = new Set(entries.map(e => e.worker_name)).size;
    return { totalHrs, totalOT, workers };
  }, [entries]);

  const handleSave = async (data) => {
    if (editEntry?.id) {
      await updateEntry(editEntry.id, data);
    } else {
      await createEntry(data);
    }
    setModalOpen(false);
    setEditEntry(null);
    setToast({ msg: t('save') + ' ✓', type: 'success' });
    load();
  };

  const handleDelete = async (id) => {
    await deleteEntry(id);
    setModalOpen(false);
    setEditEntry(null);
    setToast({ msg: t('delete') + ' ✓', type: 'success' });
    load();
  };

  const openEdit = (entry) => {
    setEditEntry(entry);
    setModalOpen(true);
  };

  const uniqueWorkers = useMemo(() => [...new Set(entries.map(e => e.worker_name))], [entries]);

  return (
    <div className="page">
      {toast && <Toast key={Date.now()} message={toast.msg} type={toast.type} />}

      {/* Stats */}
      <div className="stats-strip">
        <div className="stat-box">
          <div className="stat-number">{stats.totalHrs.toFixed(1)}</div>
          <div className="stat-label">{t('hours')}</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{stats.totalOT.toFixed(1)}</div>
          <div className="stat-label">{t('overtime')}</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{stats.workers}</div>
          <div className="stat-label">{t('filterByWorker').split(' ').pop()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <button
          className={`filter-chip ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FilterIcon /> {t('filters')}
        </button>
        {filters.worker_name && (
          <span className="filter-chip active" onClick={() => setFilters(f => ({ ...f, worker_name: '' }))}>
            {filters.worker_name} ×
          </span>
        )}
        {filters.project_id && (
          <span className="filter-chip active" onClick={() => setFilters(f => ({ ...f, project_id: '' }))}>
            {projects.find(p => p.id === parseInt(filters.project_id))?.name} ×
          </span>
        )}
      </div>

      {showFilters && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('filterByWorker')}</label>
              <select className="form-select" value={filters.worker_name}
                onChange={e => setFilters(f => ({ ...f, worker_name: e.target.value }))}>
                <option value="">{t('allWorkers')}</option>
                {uniqueWorkers.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('filterByProject')}</label>
              <select className="form-select" value={filters.project_id}
                onChange={e => setFilters(f => ({ ...f, project_id: e.target.value }))}>
                <option value="">{t('allProjects')}</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('startDate')}</label>
              <input className="form-input" type="date" value={filters.start_date}
                onChange={e => setFilters(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('endDate')}</label>
              <input className="form-input" type="date" value={filters.end_date}
                onChange={e => setFilters(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>
        </div>
      )}

      {/* Entries list */}
      {loading ? (
        <div className="empty-state"><p>{t('loadingData')}</p></div>
      ) : entries.length === 0 ? (
        <div className="empty-state">
          <ClockIcon />
          <p>{t('noEntries')}</p>
        </div>
      ) : (
        entries.map(entry => (
          <div key={entry.id} className="card" onClick={() => openEdit(entry)} style={{ cursor: 'pointer' }}>
            <div className="card-row">
              <div>
                <div className="card-title">{entry.worker_name}</div>
                <div className="card-subtitle">{entry.project.name}</div>
              </div>
              <div className="card-value hours">{entry.hours}h</div>
            </div>
            <div className="card-row" style={{ marginTop: 6 }}>
              <span className="card-label">{entry.date}</span>
              {entry.task_description && (
                <span className="card-value" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {entry.task_description}
                </span>
              )}
              {entry.overtime > 0 && (
                <span className="badge active" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--accent)' }}>
                  +{entry.overtime} OT
                </span>
              )}
            </div>
          </div>
        ))
      )}

      {/* FAB */}
      <button className="fab" onClick={() => { setEditEntry(null); setModalOpen(true); }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      {/* Modal */}
      <Modal open={modalOpen} title={editEntry ? t('editEntry') : t('addEntry')}
        onClose={() => { setModalOpen(false); setEditEntry(null); }}>
        <EntryForm
          entry={editEntry}
          projects={projects}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={() => { setModalOpen(false); setEditEntry(null); }}
        />
      </Modal>
    </div>
  );
}
