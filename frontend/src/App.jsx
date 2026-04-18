import { useState } from 'react';
import { I18nProvider, useI18n } from './i18n';
import EntriesPage from './components/EntriesPage';
import ProjectsPage from './components/ProjectsPage';
import WorkersPage from './components/WorkersPage';
import ExpensesPage from './components/ExpensesPage';
import ExportPage from './components/ExportPage';
import Toast from './components/Toast';

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const FolderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);
const ReceiptIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/>
    <path d="M8 10h8"/><path d="M8 14h4"/>
  </svg>
);
const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);
const ShareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

function AppShell() {
  const { t, lang, toggleLang } = useI18n();
  const [tab, setTab] = useState('entries');
  const [toast, setToast] = useState(null);

  const pages = {
    entries: EntriesPage,
    projects: ProjectsPage,
    workers: WorkersPage,
    expenses: ExpensesPage,
    export: ExportPage,
  };
  const Page = pages[tab];

  const handleShare = async () => {
    const url = window.location.href;
    const text = `${t('shareMessage')} ${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: t('appTitle'), text, url });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setToast({ msg: t('copied'), type: 'success' });
    }
  };

  return (
    <div className="app-shell">
      {toast && <Toast key={Date.now()} message={toast.msg} type={toast.type} />}

      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo">TS</div>
          <h1 className="header-title">{t('appTitle')}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="lang-toggle" onClick={handleShare} title={t('shareApp')}>
            <ShareIcon />
          </button>
          <button className="lang-toggle" onClick={toggleLang}>
            <span className="flag">{lang === 'en' ? '🇺🇸' : '🇲🇽'}</span>
            {lang === 'en' ? 'EN' : 'ES'}
          </button>
        </div>
      </header>

      <Page />

      {/* Footer credit */}
      <div className="app-footer">
        {t('createdBy')}: Dr. Ken Barnes
      </div>

      <nav className="bottom-nav">
        <button className={`nav-item ${tab === 'entries' ? 'active' : ''}`} onClick={() => setTab('entries')}>
          <ClockIcon /> {t('navEntries')}
        </button>
        <button className={`nav-item ${tab === 'expenses' ? 'active' : ''}`} onClick={() => setTab('expenses')}>
          <ReceiptIcon /> {t('navExpenses')}
        </button>
        <button className={`nav-item ${tab === 'projects' ? 'active' : ''}`} onClick={() => setTab('projects')}>
          <FolderIcon /> {t('navProjects')}
        </button>
        <button className={`nav-item ${tab === 'workers' ? 'active' : ''}`} onClick={() => setTab('workers')}>
          <UserIcon /> {t('navWorkers')}
        </button>
        <button className={`nav-item ${tab === 'export' ? 'active' : ''}`} onClick={() => setTab('export')}>
          <FileIcon /> {t('navExport')}
        </button>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppShell />
    </I18nProvider>
  );
}
