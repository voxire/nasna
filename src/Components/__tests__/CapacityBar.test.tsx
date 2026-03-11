import { render } from '@testing-library/react';
import CapacityBar from '../CapacityBar';

describe('CapacityBar', () => {
  it('renders green bar when occupancy is below 75%', () => {
    const { container } = render(
      <CapacityBar totalCapacity={100} currentOccupancy={50} isActive />,
    );
    expect(container.querySelector('.bg-emerald-500')).toBeInTheDocument();
  });

  it('renders yellow bar when occupancy is 75-90%', () => {
    const { container } = render(
      <CapacityBar totalCapacity={100} currentOccupancy={80} isActive />,
    );
    expect(container.querySelector('.bg-amber-500')).toBeInTheDocument();
  });

  it('renders red bar when occupancy is above 90%', () => {
    const { container } = render(
      <CapacityBar totalCapacity={100} currentOccupancy={95} isActive />,
    );
    expect(container.querySelector('.bg-rose-500')).toBeInTheDocument();
  });

  it('renders grey bar when isActive is false regardless of occupancy', () => {
    const { container } = render(
      <CapacityBar totalCapacity={100} currentOccupancy={50} isActive={false} />,
    );
    expect(container.querySelector('.bg-gray-300')).toBeInTheDocument();
    expect(container.querySelector('.bg-emerald-500')).not.toBeInTheDocument();
  });

  it('clamps occupancy to 100% maximum', () => {
    const { container } = render(
      <CapacityBar totalCapacity={10} currentOccupancy={200} isActive />,
    );
    const bar = container.querySelector('[style]') as HTMLElement;
    expect(bar?.style.width).toBe('100%');
  });
});
