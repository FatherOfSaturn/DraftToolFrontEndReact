import { requestJson } from '../../../shared/api/httpClient';
import type { Card } from '../../../shared/model/cardTypes';

export const scryfallApi = {
  getCardById(scryfallId: string): Promise<Card> {
    return requestJson<Card>(`/scryfall/cards/${encodeURIComponent(scryfallId)}/cubecobra`);
  },

  getCardsByNames(names: string[]): Promise<{ cards: Card[]; notFound: string[] }> {
    return requestJson('/scryfall/cards/batch/cubecobra', {
      method: 'POST',
      body: JSON.stringify({ names }),
    });
  },
};
