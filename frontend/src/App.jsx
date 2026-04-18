import { useState } from 'react';
import { I18nProvider, useI18n } from './i18n';
import EntriesPage from './components/EntriesPage';
import ProjectsPage from './components/ProjectsPage';
import ExportPage from './components/ExportPage';

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
const FileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);

function AppShell() {
  const { t, lang, toggleLang } = useI18n();
  const [tab, setTab] = useState('entries');

  const pages = { entries: EntriesPage, projects: ProjectsPage, export: ExportPage };
  const Page = pages[tab];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo">TS</div>
          <h1 className="header-title">{t('appTitle')}</h1>
        </div>
        <button className="lang-toggle" onClick={toggleLang}>
          <span className="flag">{lang === 'en' ? '🇺🇸' : '🇲🇽'}</span>
          {lang === 'en' ? 'EN' : 'ES'}
        </button>
      </header>

      <Page />

      <nav className="bottom-nav">
        <button className={`nav-item ${tab === 'entries' ? 'active' : ''}`} onClick={() => setTab('entries')}>
          <ClockIcon /> {t('navEntries')}
        </button>
        <button className={`nav-item ${tab === 'projects' ? 'active' : ''}`} onClick={() => setTab('projects')}>
          <FolderIcon /> {t('navProjects')}
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
