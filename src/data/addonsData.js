export const ALL_ADDONS = [
  { id: 'engine-bay-cleaning', name: 'Engine bay Cleaning (low-moisture)', price: 50 },
  { id: 'undercarriage-flush', name: 'Undercarriage Flush (express)', price: 30 },
  { id: 'pet-hair-removal', name: 'Pet hair removal (per area)', price: 50 },
  { id: 'deep-undercarriage-clean', name: 'Deep Undercarriage Clean', price: 60 },
  { id: 'seat-shampoo', name: 'Seat shampoo (per fabric seat)', price: 40 },
  { id: 'leather-clean-condition', name: 'Leather clean & condition (per seat)', price: 50 },
  { id: 'headlight-polish', name: 'Headlight polish (pair)', price: 200 },
  { id: 'deodorizing', name: 'Deodorizing', price: 50 },
];

export const ADDON_SLUG_MAP = {
  '#manual-wash-ads': [
    ALL_ADDONS[0], // Engine bay Cleaning
    ALL_ADDONS[1], // Undercarriage Flush
    ALL_ADDONS[2], // Pet hair removal
    ALL_ADDONS[3], // Deep Undercarriage Clean
    ALL_ADDONS[4], // Seat shampoo
    ALL_ADDONS[5], // Leather clean & condition
    ALL_ADDONS[6], // Headlight polish
    ALL_ADDONS[7], // Deodorizing
  ],
  '#manual-wash-quick-high-flow-rinse': [
    ALL_ADDONS[1], // Undercarriage Flush
  ],
  '#manual-wash-rinse': [
    ALL_ADDONS[3], // Deep Undercarriage Clean
  ],
};
