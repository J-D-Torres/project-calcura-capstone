/*Jonathan Torres wrote all 52 lines of code for this file*/
import { render, screen, fireEvent } from '@testing-library/react';
import { Footer } from '../components/Footer';

describe('Footer', () => {
  const defaultProps = {
    onAboutClick: vi.fn(),
    onContactClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders footer section headings', () => {
    render(<Footer {...defaultProps} />);
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByText('Follow Us')).toBeInTheDocument();
  });

  it('renders copyright notice', () => {
    render(<Footer {...defaultProps} />);
    expect(screen.getByText('© 2025 Calcura. All rights reserved.')).toBeInTheDocument();
  });

  it('calls onAboutClick when About is clicked', () => {
    render(<Footer {...defaultProps} />);
    fireEvent.click(screen.getByText('About'));
    expect(defaultProps.onAboutClick).toHaveBeenCalled();
  });

  it('calls onContactClick when Contact Us is clicked', () => {
    render(<Footer {...defaultProps} />);
    fireEvent.click(screen.getByText('Contact Us'));
    expect(defaultProps.onContactClick).toHaveBeenCalled();
  });

  // Modified by Jonathan Torres: assertions updated to match the current Footer (Security/Help Center removed, FAQs added)
  it('renders product links', () => {
    render(<Footer {...defaultProps} />);
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Updates')).toBeInTheDocument();
  });

  it('renders support links', () => {
    render(<Footer {...defaultProps} />);
    expect(screen.getByText('FAQs')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
  });
});
