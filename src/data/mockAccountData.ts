/**
 * Mock data for the Account page. There is no backend support for
 * account history yet — this is entirely client-side placeholder data,
 * structured the way a real "list my past drafts / saved decks" endpoint
 * would plausibly return it, so swapping in real API calls later is a
 * matter of replacing these two arrays with fetched data of the same shape.
 */

export interface PastRitual {
  gameID: string;
  name: string;
  partnerName: string;
  date: string; // ISO yyyy-mm-dd, for real date filtering
}

export interface SavedManifestation {
  id: string;
  name: string;
  partnerName: string;
}

export const MOCK_PAST_RITUALS: PastRitual[] = [
  { gameID: 'AG-992-PX', name: 'Grand Archmage Valerius', partnerName: 'Valerius', date: '2023-10-24' },
  { gameID: 'AG-881-MZ', name: 'The Shadow Weaver', partnerName: 'Shadow Weaver', date: '2023-10-12' },
  { gameID: 'AG-754-LY', name: 'Crystalline Seer', partnerName: 'Seer', date: '2023-10-05' },
  { gameID: 'AG-612-QQ', name: 'Elder Dragon Kaelthas', partnerName: 'Kaelthas', date: '2023-09-28' },
  { gameID: 'AG-503-RT', name: 'Whispering Void', partnerName: 'Nyx', date: '2023-09-14' },
  { gameID: 'AG-447-WC', name: 'Tempest of Embers', partnerName: 'Ignis', date: '2023-08-30' },
];

export const MOCK_SAVED_MANIFESTATIONS: SavedManifestation[] = [
  { id: 'AG-992-PX', name: "Voidwalker's Decree", partnerName: 'Valerius' },
  { id: 'AG-881-MZ', name: 'Ashborn Titan', partnerName: 'Shadow Weaver' },
  { id: 'AG-754-LY', name: 'Crystalline Resonance', partnerName: 'Seer' },
];
