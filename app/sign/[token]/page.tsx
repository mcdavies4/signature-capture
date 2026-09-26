'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import SignaturePad from '@/components/SignaturePad';
import { supabase } from '@/lib/supabase';

export default function SignPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'pending' | 'signed' | 'invalid'>('loading');
  const [signerName, setSignerName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('signature_requests')
        .select('signer_name, status')
        .eq('token', token)
        .single();

      if (error || !data) return setStatus('invalid');
      setSignerName(data.signer_name);
      setNameInput(data.signer_name || '');
      setStatus(data.status === 'signed' ? 'signed' : 'pending');
    })();
  }, [token]);

  const handleSave = async (dataUrl: string) => {
    setSaving(true);
    const res = await fetch('/api/signatures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, dataUrl, signerName: nameInput.trim() }),
    });
    setSaving(false);
    if (res.ok) setStatus('signed');
  };

  if (status === 'loading') return <Centered>Loading...</Centered>;
  if (status === 'invalid') return <Centered>This link isn't valid.</Centered>;
  if (status === 'signed')
    return <Centered>Thanks{signerName ? `, ${signerName}` : ''} - your signature has been received.</Centered>;

  return (
    <div style={{ maxWidth: 480, margin: '60px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Sign here</h1>
      <p style={{ color: '#555', marginBottom: 16 }}>
        Enter your name, then draw your signature below.
      </p>
      <input
        placeholder="Your full name"
        value={nameInput}
        onChange={(e) => setNameInput(e.target.value)}
        style={{
          width: '100%',
          padding: 10,
          marginBottom: 20,
          border: '1px solid #ccc',
          borderRadius: 6,
          fontSize: 16,
          boxSizing: 'border-box',
        }}
      />
      {nameInput.trim() ? (
        <SignaturePad onSave={handleSave} saving={saving} />
      ) : (
        <p style={{ color: '#999', fontSize: 14 }}>Enter your name to unlock the signature pad.</p>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontSize: 18 }}>
      {children}
    </div>
  );
}
