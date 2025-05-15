import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { owner, repo, token } = await request.json();

    // Validate input
    if (!owner || !repo || !token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create config content
    const configContent = `export const GITHUB_CONFIG = {
  token: '${token}',
  owner: '${owner}',
  repo: '${repo}',
  apiUrl: 'https://api.github.com'
};`;

    // Write to config file
    const configPath = path.join(process.cwd(), 'src/config/github.ts');
    await fs.writeFile(configPath, configContent, 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating config:', error);
    return NextResponse.json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
} 
