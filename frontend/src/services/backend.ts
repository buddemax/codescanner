import { ScanResult } from './ai-scanner';

const BACKEND_URL = 'http://localhost:8000';

export async function scanCodeWithBackend(content: string, filename: string): Promise<ScanResult[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        filename,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(`Backend scan failed: ${errorData.detail || response.statusText}`);
    }

    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from backend');
    }

    let text = data.candidates[0].content.parts[0].text;
    // Remove Markdown code block if present (handles ```json ... ```, ``` ... ```, etc.)
    text = text.replace(/^```(?:json)?\n/, '').replace(/```$/, '').trim();

    try {
      // Try to parse the response as JSON
      const results = JSON.parse(text);
      if (!Array.isArray(results)) {
        throw new Error('Invalid response format: expected an array');
      }
      return results.map(result => ({
        type: result.type || 'error',
        severity: result.severity || 'medium',
        message: result.message || 'Unknown issue',
        location: result.location || 'Unknown location',
        impact: result.impact || 5,
        effort: result.effort || 5,
        recommendation: result.recommendation || 'No recommendation available'
      }));
    } catch (parseError) {
      console.error('Failed to parse scan results:', parseError, text);
      throw new Error('Invalid response format from backend');
    }
  } catch (error) {
    console.error('Error scanning code with backend:', error);
    throw error;
  }
}

export async function sendNotification(message: string, scanResults?: ScanResult[]): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_URL}/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        scan_results: scanResults,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(`Backend notification failed: ${errorData.detail || response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

export async function estimateCoverageWithBackend(sourceFiles: {name: string, content: string}[], testFiles: {name: string, content: string}[]): Promise<number> {
  try {
    const response = await fetch(`${BACKEND_URL}/coverage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceFiles,
        testFiles,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(`Backend coverage estimation failed: ${errorData.detail || response.statusText}`);
    }

    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from backend');
    }

    let text = data.candidates[0].content.parts[0].text;
    text = text.replace(/^```(?:json)?\n/, '').replace(/```$/, '').trim();
    const match = text.match(/\d+/);
    return match ? Math.min(100, Math.max(0, parseInt(match[0], 10))) : 0;
  } catch (error) {
    console.error('Error estimating coverage with backend:', error);
    throw error;
  }
} 
