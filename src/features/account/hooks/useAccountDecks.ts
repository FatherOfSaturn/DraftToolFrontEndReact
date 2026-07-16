import { useEffect, useMemo, useRef, useState } from 'react';
import { getErrorMessage } from '../../../shared/lib/errors';
import { accountApi } from '../api/accountApi';
import type { Deck } from '../model/accountTypes';

const PAGE_SIZE = 10;

export interface DeckPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;
}

export function useAccountDecks(accountID?: string) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const currentAccountID = useRef(accountID);
  currentAccountID.current = accountID;

  useEffect(() => {
    setDecks([]);
    setError(null);
    setCurrentPage(1);

    if (!accountID) {
      setIsLoading(false);
      return;
    }

    let ignore = false;
    setIsLoading(true);
    accountApi
      .getDecks(accountID)
      .then((nextDecks) => {
        if (!ignore) setDecks(nextDecks);
      })
      .catch((err: unknown) => {
        if (!ignore) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [accountID]);

  const totalPages = Math.max(1, Math.ceil(decks.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const pagedDecks = useMemo(
    () => decks.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [decks, safePage]
  );

  const pagination: DeckPagination = {
    currentPage: safePage,
    totalPages,
    totalItems: decks.length,
    nextPage: () => setCurrentPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setCurrentPage((p) => Math.max(p - 1, 1)),
    setPage: (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages))),
  };

  async function deleteDeck(deckID: string) {
    if (!accountID || !window.confirm('Delete this deck?')) return;

    const requestedAccountID = accountID;
    setError(null);
    try {
      await accountApi.deleteDeck(requestedAccountID, deckID);
      if (currentAccountID.current === requestedAccountID) {
        setDecks((current) => current.filter((deck) => deck.deckID !== deckID));
      }
    } catch (err) {
      if (currentAccountID.current === requestedAccountID) setError(getErrorMessage(err));
    }
  }

  async function updateDeck(deckID: string, name: string, description: string, cardIds: string[]) {
    if (!accountID) return;

    const requestedAccountID = accountID;
    setError(null);
    try {
      await accountApi.updateDeck(requestedAccountID, deckID, name, description, cardIds);
      if (currentAccountID.current === requestedAccountID) {
        setDecks((current) =>
          current.map((d) =>
            d.deckID === deckID ? { ...d, name, description, updatedAt: new Date().toISOString() } : d
          )
        );
      }
    } catch (err) {
      if (currentAccountID.current === requestedAccountID) setError(getErrorMessage(err));
    }
  }

  return { decks: pagedDecks, allDecks: decks, isLoading, error, deleteDeck, updateDeck, pagination };
}
