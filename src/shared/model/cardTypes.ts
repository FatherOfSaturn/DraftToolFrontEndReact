// These mirror the existing Angular interfaces / Java DTOs exactly.
// Keep field names in sync with the backend; do not rename without
// updating org.magic.draft.api on the Java side too.

export interface CardDetail {
  set: string;
  set_name: string;
  scryfall_id: string;
  image_small: string;
  image_normal: string;
  image_flip: string | null;
  name: string;
  parsed_cost: string[];
}

export interface Card {
  cardID: string;
  name: string;
  details: CardDetail;
  cmc: number;
  type_line: string;
  reveal: boolean;
}
