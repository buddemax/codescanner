'use client';

import { useState, useEffect } from 'react';
import { GITHUB_CONFIG } from '@/config/github';

interface Settings {
  theme: 'light' | 'dark';
  fontSize: number;
  ruleSets: string[];
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    screenReader: boolean;
  };
  github: {
    token: string;
    owner: string;
    repo: string;
  };
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>({
    theme: 'dark',
    fontSize: 14,
    ruleSets: ['eslint', 'typescript'],
    accessibility: {
      highContrast: false,
      reducedMotion: false,
      screenReader: false
    },
    github: {
      token: GITHUB_CONFIG.getToken(),
      owner: GITHUB_CONFIG.getOwner(),
      repo: GITHUB_CONFIG.getRepo()
    }
  });

  // Load GitHub settings from session storage on component mount
  useEffect(() => {
    const token = GITHUB_CONFIG.getToken();
    const owner = GITHUB_CONFIG.getOwner();
    const repo = GITHUB_CONFIG.getRepo();
    
    if (token || owner || repo) {
      setSettings(prev => ({
        ...prev,
        github: {
          token: token || prev.github.token,
          owner: owner || prev.github.owner,
          repo: repo || prev.github.repo
        }
      }));
    }
  }, []);

  const handleThemeChange = (theme: 'light' | 'dark') => {
    setSettings(prev => ({ ...prev, theme }));
    document.documentElement.classList.toggle('dark', theme === 'dark');
  };

  const handleFontSizeChange = (size: number) => {
    setSettings(prev => ({ ...prev, fontSize: size }));
    document.documentElement.style.fontSize = `${size}px`;
  };

  const handleRuleSetToggle = (ruleSet: string) => {
    setSettings(prev => ({
      ...prev,
      ruleSets: prev.ruleSets.includes(ruleSet)
        ? prev.ruleSets.filter(r => r !== ruleSet)
        : [...prev.ruleSets, ruleSet]
    }));
  };

  const handleAccessibilityChange = (key: keyof Settings['accessibility']) => {
    setSettings(prev => ({
      ...prev,
      accessibility: {
        ...prev.accessibility,
        [key]: !prev.accessibility[key]
      }
    }));
  };

  const handleGithubConfigChange = (key: keyof Settings['github'], value: string) => {
    setSettings(prev => ({
      ...prev,
      github: {
        ...prev.github,
        [key]: value
      }
    }));

    // Persist to session storage
    switch (key) {
      case 'token':
        GITHUB_CONFIG.setToken(value);
        break;
      case 'owner':
        GITHUB_CONFIG.setOwner(value);
        break;
      case 'repo':
        GITHUB_CONFIG.setRepo(value);
        break;
    }
  };

  return (
    <div className="h-full bg-white dark:bg-gray-800 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-6">Settings</h2>

      {/* GitHub Repository Settings */}
      <div className="mb-6">
        <h3 className="text-md font-medium mb-3">GitHub Repository</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm mb-1">GitHub Token</label>
            <input
              type="password"
              value={settings.github.token}
              onChange={(e) => handleGithubConfigChange('token', e.target.value)}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter GitHub token"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Repository Owner</label>
            <input
              type="text"
              value={settings.github.owner}
              onChange={(e) => handleGithubConfigChange('owner', e.target.value)}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter repository owner"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Repository Name</label>
            <input
              type="text"
              value={settings.github.repo}
              onChange={(e) => handleGithubConfigChange('repo', e.target.value)}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter repository name"
            />
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="mb-6">
        <h3 className="text-md font-medium mb-3">Theme</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => handleThemeChange('light')}
            className={`px-4 py-2 rounded ${
              settings.theme === 'light'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            Light
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`px-4 py-2 rounded ${
              settings.theme === 'dark'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            Dark
          </button>
        </div>
      </div>

      {/* Font Size */}
      <div className="mb-6">
        <h3 className="text-md font-medium mb-3">Font Size</h3>
        <input
          type="range"
          min="12"
          max="20"
          value={settings.fontSize}
          onChange={(e) => handleFontSizeChange(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {settings.fontSize}px
        </div>
      </div>

      {/* Rule Sets */}
      <div className="mb-6">
        <h3 className="text-md font-medium mb-3">Rule Sets</h3>
        <div className="space-y-2">
          {['eslint', 'typescript', 'stylelint', 'prettier'].map(ruleSet => (
            <label key={ruleSet} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.ruleSets.includes(ruleSet)}
                onChange={() => handleRuleSetToggle(ruleSet)}
                className="rounded"
              />
              <span className="capitalize">{ruleSet}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Accessibility */}
      <div className="mb-6">
        <h3 className="text-md font-medium mb-3">Accessibility</h3>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.accessibility.highContrast}
              onChange={() => handleAccessibilityChange('highContrast')}
              className="rounded"
            />
            <span>High Contrast</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.accessibility.reducedMotion}
              onChange={() => handleAccessibilityChange('reducedMotion')}
              className="rounded"
            />
            <span>Reduced Motion</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.accessibility.screenReader}
              onChange={() => handleAccessibilityChange('screenReader')}
              className="rounded"
            />
            <span>Screen Reader Mode</span>
          </label>
        </div>
      </div>
    </div>
  );
} 