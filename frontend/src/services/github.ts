import { GITHUB_CONFIG } from '../config/github';

export interface RepositoryInfo {
  name: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  lastUpdated: string;
  languages: { [key: string]: number };
}

export interface FileChange {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  raw_url: string;
}

export interface Commit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  html_url: string;
  files?: FileChange[];
}

export interface RepositoryFile {
  name: string;
  path: string;
  type: string;
  content?: string;
  sha: string;
}

export async function getRepositoryInfo(): Promise<RepositoryInfo> {
  const response = await fetch(
    `${GITHUB_CONFIG.getApiUrl()}/repos/${GITHUB_CONFIG.getOwner()}/${GITHUB_CONFIG.getRepo()}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_CONFIG.getToken()}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch repository information');
  }

  const data = await response.json();
  
  // Get languages
  const languagesResponse = await fetch(
    `${GITHUB_CONFIG.getApiUrl()}/repos/${GITHUB_CONFIG.getOwner()}/${GITHUB_CONFIG.getRepo()}/languages`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_CONFIG.getToken()}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const languages = await languagesResponse.json();

  return {
    name: data.name,
    description: data.description,
    stars: data.stargazers_count,
    forks: data.forks_count,
    openIssues: data.open_issues_count,
    lastUpdated: data.updated_at,
    languages,
  };
}

export async function getCommitHistory(): Promise<Commit[]> {
  const response = await fetch(
    `${GITHUB_CONFIG.getApiUrl()}/repos/${GITHUB_CONFIG.getOwner()}/${GITHUB_CONFIG.getRepo()}/commits`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_CONFIG.getToken()}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch commit history');
  }

  const commits = await response.json();
  return commits.map((commit: any) => ({
    sha: commit.sha,
    message: commit.commit.message,
    author: {
      name: commit.commit.author.name,
      email: commit.commit.author.email,
      date: commit.commit.author.date,
    },
    html_url: commit.html_url,
  }));
}

export async function getCommitDetails(sha: string): Promise<Commit> {
  const response = await fetch(
    `${GITHUB_CONFIG.getApiUrl()}/repos/${GITHUB_CONFIG.getOwner()}/${GITHUB_CONFIG.getRepo()}/commits/${sha}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_CONFIG.getToken()}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch commit details');
  }

  const commit = await response.json();
  return {
    sha: commit.sha,
    message: commit.commit.message,
    author: {
      name: commit.commit.author.name,
      email: commit.commit.author.email,
      date: commit.commit.author.date,
    },
    html_url: commit.html_url,
    files: commit.files.map((file: any) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
      patch: file.patch,
      raw_url: file.raw_url,
    })),
  };
}

export async function getRepositoryFiles(path: string = ''): Promise<RepositoryFile[]> {
  const response = await fetch(
    `${GITHUB_CONFIG.getApiUrl()}/repos/${GITHUB_CONFIG.getOwner()}/${GITHUB_CONFIG.getRepo()}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_CONFIG.getToken()}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch repository files');
  }

  const files = await response.json();
  const fileList = Array.isArray(files) ? files : [files];
  
  // Recursively get files from subdirectories
  const allFiles: RepositoryFile[] = [];
  
  for (const file of fileList) {
    if (file.type === 'dir') {
      // Recursively get files from subdirectory
      const subFiles = await getRepositoryFiles(file.path);
      allFiles.push(...subFiles);
    } else {
      allFiles.push(file);
    }
  }
  
  return allFiles;
}

export async function getFileContent(path: string): Promise<string> {
  const response = await fetch(
    `${GITHUB_CONFIG.getApiUrl()}/repos/${GITHUB_CONFIG.getOwner()}/${GITHUB_CONFIG.getRepo()}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_CONFIG.getToken()}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch file content');
  }

  const file = await response.json();
  return atob(file.content);
} 
