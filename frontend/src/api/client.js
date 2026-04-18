const BASE = '/api';

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

// Projects
export const getProjects = (activeOnly = true) =>
  request(`/projects/?active_only=${activeOnly}`);

export const createProject = (data) =>
  request('/projects/', { method: 'POST', body: JSON.stringify(data) });

export const updateProject = (id, data) =>
  request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteProject = (id) =>
  request(`/projects/${id}`, { method: 'DELETE' });

// Entries
export const getEntries = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, v);
  });
  return request(`/entries/?${qs}`);
};

export const createEntry = (data) =>
  request('/entries/', { method: 'POST', body: JSON.stringify(data) });

export const updateEntry = (id, data) =>
  request(`/entries/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const deleteEntry = (id) =>
  request(`/entries/${id}`, { method: 'DELETE' });

// Excel
export const exportExcel = async (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, v);
  });
  const res = await fetch(`${BASE}/excel/export?${qs}`);
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'timesheet_export.xlsx';
  a.click();
  URL.revokeObjectURL(url);
};

export const importExcel = async (file) => {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/excel/import`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Import failed');
  return res.json();
};
