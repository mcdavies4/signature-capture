'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Req = {
  id: string;
  signer_name: string;
  signer_email: string | null;
  status: string;
  signature_url: string | null;
  signed_at: string | null;
  token: string;
};

export default function AdminPage() {
  const [rows, setRows] = useState<Req[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newLink, setNewLink] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('signature_requests')
      .select('*')
      .order('created_at', { ascending: false });
    setRows(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const addSigner = async () => {
    const res = await fetch('/api/signatures', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signer_name: name, signer_email: email }),
    });
    const data = await res.json();
    setNewLink(data.link);
    setName('');
    setEmail('');
    load();
  };

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px', fontFamily: 'system-ui' }}>
      <h1>Signature requests</h1>

      <div style={{ display: 'flex', gap: 8, margin: '20px 0' }}>
        <input
          placeholder="Name (optional — they'll enter it themselves too)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: 1, padding: 8, border: '1px solid #ccc', borderRadius: 6 }}
        />
        <input
          placeholder="Email (optional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ flex: 1, padding: 8, border: '1px solid #ccc', borderRadius: 6 }}
        />
        <button onClick={addSigner} style={{ padding: '8px 16px' }}>
          Generate link
        </button>
      </div>

      {newLink && (
        <p style={{ background: '#eef9ee', padding: 10, borderRadius: 6, fontSize: 14 }}>
          Send this link: <a href={newLink}>{newLink}</a>
        </p>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
            <th style={{ padding: 8 }}>Name</th>
            <th>Status</th>
            <th>Signature</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{r.signer_name}</td>
              <td>{r.status}</td>
              <td>
                {r.signature_url ? (
                  <>
                    <img src={r.signature_url} style={{ height: 40, verticalAlign: 'middle' }} />
                    <a href={r.signature_url} download style={{ marginLeft: 10 }}>
                      Download
                    </a>
                  </>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
