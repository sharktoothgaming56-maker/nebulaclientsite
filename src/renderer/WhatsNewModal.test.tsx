import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WhatsNewModal } from './WhatsNewModal';

describe('WhatsNewModal', () => {
  const changelog = `- Feature A added\n- Bug fix B fixed\n- Performance improvements`;

  test('renders each changelog line as list item', () => {
    const handleClose = jest.fn();
    render(<WhatsNewModal changelog={changelog} onClose={handleClose} />);

    // Expect three list items
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Feature A added');
    expect(items[1]).toHaveTextContent('Bug fix B fixed');
    expect(items[2]).toHaveTextContent('Performance improvements');
  });

  test('calls onClose when OK button clicked', () => {
    const handleClose = jest.fn();
    render(<WhatsNewModal changelog={changelog} onClose={handleClose} />);
    const okButton = screen.getByRole('button', { name: /ok/i });
    fireEvent.click(okButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
