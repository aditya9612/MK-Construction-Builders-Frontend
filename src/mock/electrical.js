export const ELECTRICAL_ROOMS = [
  {
    id: 'hall',
    label: 'Hall',
    points: [
      { code: 'light', label: 'Light' },
      { code: 'fan', label: 'Fan' },
      { code: 'main_socket', label: 'Main Board Socket' },
      { code: 'tv', label: 'TV Socket' },
      { code: 'ac', label: 'AC Point' },
      { code: 'charging', label: 'Charging Socket' },
      { code: 'bell', label: 'Bell' },
      { code: 'washing', label: 'Washing Machine' },
      { code: 'balcony_light', label: 'Balcony Light' },
    ],
  },
  {
    id: 'bedroom',
    label: 'Bedroom',
    points: [
      { code: 'light', label: 'Light' },
      { code: 'fan', label: 'Fan' },
      { code: 'main_socket', label: 'Main Board Socket' },
      { code: 'charging', label: 'Charging Socket' },
      { code: 'ac', label: 'AC Point' },
    ],
  },
  {
    id: 'kitchen',
    label: 'Kitchen',
    points: [
      { code: 'light', label: 'Light' },
      { code: 'fan', label: 'Fan' },
      { code: 'main_socket', label: 'Main Board Socket' },
      { code: 'mixer', label: 'Mixer Socket' },
      { code: 'oven', label: 'Oven Point' },
      { code: 'fridge', label: 'Fridge Point' },
      { code: 'exhaust', label: 'Exhaust Fan' },
      { code: 'aqua', label: 'Aqua Point' },
    ],
  },
  {
    id: 'bathroom',
    label: 'Bathroom',
    points: [
      { code: 'light', label: 'Light' },
      { code: 'exhaust', label: 'Exhaust Fan' },
      { code: 'trimmer', label: 'Trimer Socket' },
      { code: 'geyser', label: 'Gezer Socket' },
      { code: 'passage', label: 'Passage Light' },
      { code: 'mirror', label: 'Mirror Lights' },
    ],
  },
  {
    id: 'parking',
    label: 'Open Parking',
    points: [
      { code: 'light', label: 'Light' },
      { code: 'socket', label: 'Socket' },
    ],
  },
  {
    id: 'terrace',
    label: 'Terrace + Staircase Passage',
    points: [
      { code: 'terrace_light', label: 'Terrace Light' },
      { code: 'stair_light', label: 'Staircase Passage Light' },
      { code: 'earthing', label: 'Earthing' },
    ],
  },
];

export const MOCK_ELECTRICAL_MASTER = ELECTRICAL_ROOMS.flatMap((room) =>
  room.points.map((point) => ({
    id: `el_${room.id}_${point.code}`,
    room: room.label,
    name: point.label,
    code: point.code,
    unit: 'nos',
    defaultQty: 0,
    status: 'Active',
  }))
);
