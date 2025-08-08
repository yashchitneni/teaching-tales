
import { NextRequest, NextResponse } from 'next/server';
import { fetchItemXML } from '@/lib/api/qti-client';

export async function POST(request: NextRequest) {
  try {
    const { xmlUrl } = await request.json();
    const xmlContent = await fetchItemXML(xmlUrl);
    return new NextResponse(xmlContent, {
      headers: { 'Content-Type': 'application/xml' }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
