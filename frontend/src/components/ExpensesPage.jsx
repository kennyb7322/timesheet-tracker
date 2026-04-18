import { useState, useEffect, useMemo } from 'react';
import { useI18n } from '../i18n';
import { getExpenses, getExpenseCategories, getProjects, getWorkers, createExpense, updateExpense, deleteExpense } from '../api/client';
import ExpenseForm from '../components/ExpenseForm';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const ReceiptIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/>
    <path d="M8 10h8"/><path d="M8 14h4"/>
  </svg>
);

const FilterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

export default function ExpensesPage() {
  const { t } = useI18n();
  const [expenses, setExpenses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editExp, setEditExp] = useState(null);
  const [toast, setToast] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ worker_name: '', project_id: '', category: '', start_date: '', end_date: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [exp, p, w, cats] = await Promise.all([
        getExpenses(filters), getProjects(), getWorkers(), getExpenseCategories(),
      ]);
      setExpenses(exp);
      setProjects(p);
      setWorkers(w);
      setCategories(cats.categories || []);
      setStores(cats.stores || []);
    } catch {
      setToast({ msg: 'Failed to load', type: 'error' });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [filters]);

  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);

  const handleSave = async (data) => {
    if (editExp?.id) await updateExpense(editExp.id, data);
    else await createExpense(data);
    setModalOpen(false);
    setEditExp(null);
    setToast({ msg: t('save') + ' ✓', type: 'success' });
    load();
  };

  const handleDelete = async (id) => {
    await deleteExpense(id);
    setModalOpen(false);
    setEditExp(null);
    setToast({ msg: t('delete') + ' ✓', type: 'success' });
    load();
  };

  return (
    <div className="page">
      {toast && <Toast key={Date.now()} message={toast.msg} type={toast.type} />}

      <div className="stats-strip" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="stat-box">
          <div className="stat-number" style={{ color: '#EF4444' }}>${totalSpent.toFixed(2)}</div>
          <div className="stat-label">{t('totalExpenses')}</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{expenses.length}</div>
          <div className="stat-label">{t('entries')}</div>
        </div>
      </div>

      <div className="filter-bar">
        <button className={`filter-chip ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}>
          <FilterIcon /> {t('filters')}
        </button>
        {filters.category && (
          <span className="filter-chip active" onClick={() => setFilters(f => ({ ...f, category: '' }))}>
            {filters.category} ×
          </span>
        )}
        {filters.worker_name && (
          <span className="filter-chip active" onClick={() => setFilters(f => ({ ...f, worker_name: '' }))}>
            {filters.worker_name} ×
          </span>
        )}
      </div>

      {showFilters && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('filterByCategory')}</label>
              <select className="form-select" value={filters.category}
                onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
                <option value="">{t('allCategories')}</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
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

      {loading ? (
        <div className="empty-state"><p>{t('loadingData')}</p></div>
      ) : expenses.length === 0 ? (
        <div className="empty-state">
          <ReceiptIcon />
          <p>{t('noExpenses')}</p>
        </div>
      ) : (
        expenses.map(exp => (
          <div key={exp.id} className="card" onClick={() => { setEditExp(exp); setModalOpen(true); }} style={{ cursor: 'pointer' }}>
            <div className="card-row">
              <div>
                <div className="card-title">{exp.store || exp.category}</div>
                <div className="card-subtitle">{exp.project.name} · {exp.worker_name}</div>
              </div>
              <div className="card-value hours" style={{ color: '#EF4444' }}>${exp.amount.toFixed(2)}</div>
            </div>
            <div className="card-row" style={{ marginTop: 6 }}>
              <span className="card-label">{exp.date}</span>
              <span className="badge active" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--accent)' }}>
                {exp.category}
              </span>
              {exp.receipt_ref && (
                <span className="card-value" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  #{exp.receipt_ref}
                </span>
              )}
            </div>
            {exp.description && (
              <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)' }}>{exp.description}</div>
            )}
          </div>
        ))
      )}

      <button className="fab" onClick={() => { setEditExp(null); setModalOpen(true); }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      <Modal open={modalOpen} title={editExp ? t('editExpense') : t('addExpense')}
        onClose={() => { setModalOpen(false); setEditExp(null); }}>
        <ExpenseForm
          expense={editExp}
          projects={projects}
          workers={workers}
          categories={categories}
          stores={stores}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={() => { setModalOpen(false); setEditExp(null); }}
        />
      </Modal>
    </div>
  );
}
