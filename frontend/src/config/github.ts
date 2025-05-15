export const GITHUB_CONFIG = {
  getToken: () => sessionStorage.getItem('github_token') || '',
  setToken: (token: string) => sessionStorage.setItem('github_token', token),
  getOwner: () => sessionStorage.getItem('github_owner') || '',
  setOwner: (owner: string) => sessionStorage.setItem('github_owner', owner),
  getRepo: () => sessionStorage.getItem('github_repo') || '',
  setRepo: (repo: string) => sessionStorage.setItem('github_repo', repo),
  getApiUrl: () => sessionStorage.getItem('github_api_url') || 'https://api.github.com',
  setApiUrl: (url: string) => sessionStorage.setItem('github_api_url', url)
};