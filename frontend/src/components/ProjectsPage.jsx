import { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import { getProjects, createProject, updateProject, deleteProject } from '../api/client';
import ProjectForm from '../components/ProjectForm';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const FolderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

export default function ProjectsPage() {
  const { t } = useI18n();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProj, setEditProj] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [toast, setToast] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await getProjects(!showInactive);
    setProjects(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [showInactive]);

  const handleSave = async (data) => {
    if (editProj?.id) {
      await updateProject(editProj.id, data);
    } else {
      await createProject(data);
    }
    setModalOpen(false);
    setEditProj(null);
    setToast({ msg: t('save') + ' ✓', type: 'success' });
    load();
  };

  const handleArchive = async (proj) => {
    await deleteProject(proj.id);
    setToast({ msg: t('inactive') + ' ✓', type: 'success' });
    load();
  };

  return (
    <div className="page">
      {toast && <Toast key={Date.now()} message={toast.msg} type={toast.type} />}

      <div className="filter-bar">
        <button className={`filter-chip ${!showInactive ? 'active' : ''}`}
          onClick={() => setShowInactive(false)}>
          {t('active')}
        </button>
        <button className={`filter-chip ${showInactive ? 'active' : ''}`}
          onClick={() => setShowInactive(true)}>
          {t('inactive')}
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><p>{t('loadingData')}</p></div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <FolderIcon />
          <p>{t('noProjects')}</p>
        </div>
      ) : (
        projects.map(proj => (
          <div key={proj.id} className="card" onClick={() => { setEditProj(proj); setModalOpen(true); }}
            style={{ cursor: 'pointer' }}>
            <div className="card-row">
              <div>
                <div className="card-title">{proj.name}</div>
                {proj.location && <div className="card-subtitle">📍 {proj.location}</div>}
              </div>
              <span className={`badge ${proj.is_active ? 'active' : 'inactive'}`}>
                {proj.is_active ? t('active') : t('inactive')}
              </span>
            </div>
            {proj.description && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                {proj.description}
              </div>
            )}
          </div>
        ))
      )}

      <button className="fab" onClick={() => { setEditProj(null); setModalOpen(true); }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      <Modal open={modalOpen} title={editProj ? t('editProject') : t('addProject')}
        onClose={() => { setModalOpen(false); setEditProj(null); }}>
        <ProjectForm
          project={editProj}
          onSave={handleSave}
          onCancel={() => { setModalOpen(false); setEditProj(null); }}
        />
        {editProj?.is_active === 1 && (
          <button className="btn btn-danger btn-block" style={{ marginTop: 12 }}
            onClick={() => { handleArchive(editProj); setModalOpen(false); setEditProj(null); }}>
            {t('delete')}
          </button>
        )}
      </Modal>
    </div>
  );
}
