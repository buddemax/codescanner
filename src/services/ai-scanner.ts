const GEMINI_API_KEY = 'AIzaSyDqQNM3UCwCeirsMqeaYcYL6iGOQmJ_aIE';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface ScanResult {
  type: 'error' | 'vulnerability' | 'dependency';
  severity: 'low' | 'medium' | 'high';
  message: string;
  location?: string;
  recommendation?: string;
  impact: number; // 1-10 scale for impact
  effort: number; // 1-10 scale for effort
}

function extractJsonFromMarkdown(text: string): any {
  // Remove markdown code block syntax
  const jsonStr = text.replace(/```json\n|\n```/g, '').trim();
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return { issues: [] };
  }
}

export async function scanCode(content: string, filename: string): Promise<ScanResult[]> {
  const prompt = `Analyze this code for potential issues, vulnerabilities, and outdated dependencies. 
  File: ${filename}
  Code:
  ${content}
  
  For each issue, provide:
  1. Impact score (1-10): 1 = negligible, 10 = catastrophic
     - Use decimal values for more precise scoring (e.g., 7.3, 8.5)
     - Consider factors like:
       * Security implications
       * Performance impact
       * User experience effects
       * System stability
       * Data integrity
  
  2. Effort score (1-10): 1 = very low effort to fix, 10 = enormous effort to fix
     - Use decimal values for more precise scoring (e.g., 3.7, 6.2)
     - Consider factors like:
       * Code complexity
       * Testing requirements
       * Integration challenges
       * Documentation needs
       * Deployment complexity
  
  Provide the analysis in the following JSON format:
  {
    "issues": [
      {
        "type": "error|vulnerability|dependency",
        "severity": "low|medium|high",
        "message": "description of the issue",
        "location": "where in the code",
        "recommendation": "how to fix it",
        "impact": number between 1-10 (can include decimals),
        "effort": number between 1-10 (can include decimals)
      }
    ]
  }`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze code');
    }

    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }

    const analysis = extractJsonFromMarkdown(data.candidates[0].content.parts[0].text);
    return analysis.issues || [];
  } catch (error) {
    console.error('Error scanning code:', error);
    return [];
  }
} 