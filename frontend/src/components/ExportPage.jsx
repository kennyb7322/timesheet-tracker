import { useState, useRef } from 'react';
import { useI18n } from '../i18n';
import { exportExcel, importExcel } from '../api/client';
import Toast from '../components/Toast';

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

export default function ExportPage() {
  const { t } = useI18n();
  const [toast, setToast] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [dragover, setDragover] = useState(false);
  const fileRef = useRef();

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportExcel();
      setToast({ msg: t('exportExcel') + ' ✓', type: 'success' });
    } catch {
      setToast({ msg: 'Export failed', type: 'error' });
    }
    setExporting(false);
  };

  const handleImport = async (file) => {
    try {
      const result = await importExcel(file);
      setToast({
        msg: t('importSuccess', { count: result.imported }) +
          (result.errors?.length ? ` | ${t('importErrors', { count: result.errors.length })}` : ''),
        type: result.errors?.length ? 'error' : 'success',
      });
    } catch {
      setToast({ msg: 'Import failed', type: 'error' });
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleImport(file);
  };

  return (
    <div className="page">
      {toast && <Toast key={Date.now()} message={toast.msg} type={toast.type} />}

      <div className="export-section">
        <div className="export-section-title">{t('exportExcel')}</div>
        <button className="btn btn-primary btn-block" onClick={handleExport} disabled={exporting}>
          <DownloadIcon /> {exporting ? t('downloading') : t('exportExcel')}
        </button>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
          {t('filters')} → {t('navEntries')} tab
        </p>
      </div>

      <div className="export-section">
        <div className="export-section-title">{t('importExcel')}</div>
        <div
          className={`file-drop ${dragover ? 'dragover' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragover(true); }}
          onDragLeave={() => setDragover(false)}
          onDrop={onDrop}
        >
          <UploadIcon />
          <div className="file-drop-text">{t('importExcel')}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>.xlsx</div>
        </div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden
          onChange={e => { if (e.target.files[0]) handleImport(e.target.files[0]); }} />
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-title" style={{ marginBottom: 8 }}>Excel Format</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong>Columns:</strong> Date | Worker | Project | Location | Hours | Overtime | Task | Notes
          <br /><br />
          • Date: YYYY-MM-DD<br />
          • Projects auto-created on import<br />
          • First row = headers (skipped)
        </div>
      </div>
    </div>
  );
}
