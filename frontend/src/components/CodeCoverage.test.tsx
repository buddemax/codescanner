import React from 'react';
import { render, screen } from '@testing-library/react';
import CodeCoverage from './CodeCoverage';

describe('CodeCoverage', () => {
  it('renders with correct coverage percentage', () => {
    render(<CodeCoverage coverage={75} />);
    
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Total Code Coverage')).toBeInTheDocument();
  });

  it('renders with 0% coverage', () => {
    render(<CodeCoverage coverage={0} />);
    
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders with 100% coverage', () => {
    render(<CodeCoverage coverage={100} />);
    
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
}); 