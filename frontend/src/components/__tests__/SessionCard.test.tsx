import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SessionCard } from '../SessionCard.js';
import type { Session } from '../../types/index.js';

const mockSession: Session = {
  id: '1',
  patientId: 'P001',
  patient: {
    firstName: 'John',
    lastName: 'Doe',
    dryWeight: 70.0,
    unit: 'Unit-A',
  },
  scheduledDate: '2024-01-15T00:00:00Z',
  startTime: '2024-01-15T08:00:00Z',
  endTime: '2024-01-15T12:00:00Z',
  preWeight: 72.0,
  postWeight: 70.5,
  vitals: {
    pre: {
      systolicBP: 135,
      diastolicBP: 85,
      heartRate: 72,
    },
    post: {
      systolicBP: 130,
      diastolicBP: 80,
      heartRate: 70,
    },
  },
  machineId: 'M001',
  nurseNotes: 'Session completed normally',
  status: 'completed',
  anomalies: [],
  hasAnomalies: false,
};

describe('SessionCard', () => {
  it('should render session information', () => {
    const onEdit = vi.fn();
    render(<SessionCard session={mockSession} onEdit={onEdit} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Patient ID: P001')).toBeInTheDocument();
    expect(screen.getByText('Unit: Unit-A')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
  });

  it('should display weight information', () => {
    const onEdit = vi.fn();
    render(<SessionCard session={mockSession} onEdit={onEdit} />);

    // Use regex or partial text matching to handle number formatting
    expect(screen.getByText(/72.*kg/i)).toBeInTheDocument();
    expect(screen.getByText(/70\.5.*kg/i)).toBeInTheDocument();
    expect(screen.getByText(/Target:.*70.*kg/i)).toBeInTheDocument();
  });

  it('should display vitals', () => {
    const onEdit = vi.fn();
    render(<SessionCard session={mockSession} onEdit={onEdit} />);

    expect(screen.getByText('BP: 135/85')).toBeInTheDocument();
    expect(screen.getByText('BP: 130/80')).toBeInTheDocument();
    expect(screen.getByText('HR: 72 bpm')).toBeInTheDocument();
    expect(screen.getByText('HR: 70 bpm')).toBeInTheDocument();
  });

  it('should display nurse notes', () => {
    const onEdit = vi.fn();
    render(<SessionCard session={mockSession} onEdit={onEdit} />);

    expect(screen.getByText('Session completed normally')).toBeInTheDocument();
  });

  it('should highlight anomalies when present', () => {
    const sessionWithAnomalies: Session = {
      ...mockSession,
      anomalies: ['Excess interdialytic weight gain: 4.50 kg (6.9% of dry weight)'],
      hasAnomalies: true,
    };

    const onEdit = vi.fn();
    render(<SessionCard session={sessionWithAnomalies} onEdit={onEdit} />);

    expect(screen.getByText(/Anomalies Detected/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Excess interdialytic weight gain/i)
    ).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<SessionCard session={mockSession} onEdit={onEdit} />);

    const editButton = screen.getByText('Edit Session');
    editButton.click();

    expect(onEdit).toHaveBeenCalledWith(mockSession);
  });

  it('should display correct status badge', () => {
    const inProgressSession: Session = {
      ...mockSession,
      status: 'in_progress',
    };

    const onEdit = vi.fn();
    render(<SessionCard session={inProgressSession} onEdit={onEdit} />);

    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
  });
});
