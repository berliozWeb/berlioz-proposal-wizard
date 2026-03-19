import { useState, useEffect } from 'react';
import { getAllLeads, type StoredLead } from '@/lib/leadStorage';

const AdminLeads = () => {
  const [leads, setLeads] = useState<StoredLead[]>([]);

  useEffect(() => {
    setLeads(getAllLeads());
  }, []);

  const copyCSV = () => {
    const header = 'Fecha,Nombre,Empresa,Celular,Path';
    const rows = leads.map((l) =>
      [l.timestamp, l.nombre, l.empresa, l.celular, l.path ?? ''].join(',')
    );
    navigator.clipboard.writeText([header, ...rows].join('\n'));
  };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Leads capturados ({leads.length})</h1>
      <button onClick={copyCSV} style={{ marginBottom: 16, padding: '8px 16px', cursor: 'pointer' }}>
        Copiar CSV
      </button>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Fecha', 'Nombre', 'Empresa', 'Celular', 'Path'].map((h) => (
              <th key={h} style={{ borderBottom: '1px solid #ccc', padding: 8, textAlign: 'left' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((l, i) => (
            <tr key={i}>
              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{new Date(l.timestamp).toLocaleString()}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{l.nombre}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{l.empresa}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{l.celular}</td>
              <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{l.path ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminLeads;
