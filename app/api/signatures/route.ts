import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { token, dataUrl, signerName } = await req.json();

  if (!token || !dataUrl) {
    return NextResponse.json({ error: 'Missing token or dataUrl' }, { status: 400 });
  }

  // Find the pending request for this token
  const { data: request, error: findError } = await supabase
    .from('signature_requests')
    .select('*')
    .eq('token', token)
    .single();

  if (findError || !request) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
  }

  // Decode base64 PNG
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  const path = `${token}.png`;

  const { error: uploadError } = await supabase.storage
    .from('signatures')
    .upload(path, buffer, { contentType: 'image/png', upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrl } = supabase.storage.from('signatures').getPublicUrl(path);

  const { error: updateError } = await supabase
    .from('signature_requests')
    .update({
      status: 'signed',
      signature_url: publicUrl.publicUrl,
      signed_at: new Date().toISOString(),
      ...(signerName ? { signer_name: signerName } : {}),
    })
    .eq('token', token);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: publicUrl.publicUrl });
}

// Create new signature requests (call this yourself when adding people to sign)
export async function PUT(req: NextRequest) {
  const { signer_name, signer_email } = await req.json();

  const { data, error } = await supabase
    .from('signature_requests')
    .insert({ signer_name, signer_email })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    token: data.token,
    link: `${process.env.NEXT_PUBLIC_SITE_URL}/sign/${data.token}`,
  });
}
