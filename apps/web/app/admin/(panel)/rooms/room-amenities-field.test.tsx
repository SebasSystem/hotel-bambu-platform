// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Amenity } from '@/lib/api/types';
import { RoomAmenitiesField } from './room-amenities-field';

const amenity = (id: string, name: string): Amenity =>
  ({ id, name, scope: 'ROOM', active: true }) as Amenity;
const catalog = [amenity('tv', 'Televisor'), amenity('fan', 'Ventilador'), amenity('ac', 'Aire')];

function renderField(value: { amenityId: string; available: boolean }[] = []) {
  const onChange = vi.fn();
  render(
    <RoomAmenitiesField
      typeName="Pareja"
      typeAmenityIds={['tv', 'fan']}
      catalog={catalog}
      value={value}
      onChange={onChange}
    />,
  );
  return { onChange };
}

const box = (name: RegExp) => screen.getByRole('checkbox', { name }) as HTMLInputElement;

describe('RoomAmenitiesField (owner review A9)', () => {
  afterEach(cleanup);

  it('starts with the type amenities checked (inherited) and the others unchecked', () => {
    renderField();
    expect(screen.getByText('Comodidades de esta habitación')).toBeTruthy();
    expect(box(/Televisor/).checked).toBe(true);
    expect(box(/Ventilador/).checked).toBe(true);
    expect(box(/Aire/).checked).toBe(false);
  });

  it('unchecking a type amenity marks it as missing in this room', async () => {
    const { onChange } = renderField();
    await userEvent.click(box(/Televisor/));
    expect(onChange).toHaveBeenCalledWith([{ amenityId: 'tv', available: false }]);
  });

  it('checking another amenity adds it to this room only', async () => {
    const { onChange } = renderField([{ amenityId: 'tv', available: false }]);
    expect(box(/Televisor/).checked).toBe(false);
    expect(screen.getByText(/no está en esta habitación/)).toBeTruthy();
    await userEvent.click(box(/Aire/));
    expect(onChange).toHaveBeenCalledWith([
      { amenityId: 'tv', available: false },
      { amenityId: 'ac', available: true },
    ]);
  });

  it('going back to the type value removes the override, and can reset everything', async () => {
    const { onChange } = renderField([
      { amenityId: 'tv', available: false },
      { amenityId: 'ac', available: true },
    ]);
    await userEvent.click(box(/Televisor/));
    expect(onChange).toHaveBeenLastCalledWith([{ amenityId: 'ac', available: true }]);
    await userEvent.click(screen.getByRole('button', { name: 'Usar solo las del tipo' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
