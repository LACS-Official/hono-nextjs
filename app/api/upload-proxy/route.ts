import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formData = await request.formData();
    
    const IMGBED_BASE_URL = 'https://cfbed.sanyue.de';
    const uploadUrl = new URL(`${IMGBED_BASE_URL}/upload`);
    
    // Forward query parameters
    searchParams.forEach((value, key) => {
      uploadUrl.searchParams.append(key, value);
      // Also try appending to formData if not already there, 
      // as some servers might expect these in the body
      if (!formData.has(key)) {
        formData.append(key, value);
      }
    });

    console.log(`Proxying upload to: ${uploadUrl.toString()}`);

    // Get token from private environment variable
    const token = process.env.IMGBED_TOKEN;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    const response = await fetch(uploadUrl.toString(), {
      method: 'POST',
      body: formData,
      headers: headers,
    });

    console.log(`Target server responded with: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Target server error:', errorText);
      return NextResponse.json(
        { success: false, error: `Upload failed: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Upload proxy error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
