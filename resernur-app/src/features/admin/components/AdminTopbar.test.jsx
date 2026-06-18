import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AdminTopbar from './AdminTopbar';

describe('AdminTopbar Component', () => {
  it('debería renderizar la barra superior con el título proporcionado', () => {
    render(<AdminTopbar title="Gestión de Aulas" />);

    expect(screen.getByText('Admin Suite')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gestión de Aulas' })).toBeInTheDocument();
  });
});
