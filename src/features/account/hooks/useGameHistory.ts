import { useEffect, useMemo, useRef, useState } from 'react';
import { getErrorMessage } from '../../../shared/lib/errors';
import { accountApi } from '../api/accountApi';
import type { GameSummary } from '../model/accountTypes';

const PAGE_SIZE = 10;

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  nextPage: () => void;
  prevPage: () => void;
  setPage: (page: number) => void;
}

export interface Filters {
  search: string;
  setSearch: (value: string) => void;
  playerNameFilter: string;
  setPlayerNameFilter: (value: string) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  applyFilters: () => void;
  resetFilters: () => void;
}

export function useGameHistory(accountID?: string) {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [playerNameFilter, setPlayerNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [appliedPlayerName, setAppliedPlayerName] = useState('');
  const [appliedDate, setAppliedDate] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');

  const [currentPage, setCurrentPage] = useState(1);

  const requestVersion = useRef(0);
  const currentAccountID = useRef(accountID);
  currentAccountID.current = accountID;

  useEffect(() => {
    setGames([]);
    setError(null);
    setCurrentPage(1);

    if (!accountID) {
      setIsLoading(false);
      return;
    }

    const version = ++requestVersion.current;
    setIsLoading(true);
    accountApi
      .getGameHistory(accountID)
      .then((nextGames) => {
        if (requestVersion.current !== version) return;
        setGames(nextGames);
      })
      .catch((err: unknown) => {
        if (requestVersion.current !== version) return;
        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (requestVersion.current !== version) return;
        setIsLoading(false);
      });
  }, [accountID]);

  const filteredGames = useMemo(() => {
    const searchLower = search.toLowerCase();
    const playerNameLower = appliedPlayerName.toLowerCase();

    return games.filter((game) => {
      if (searchLower) {
        const matchesSearch =
          game.gameID.toLowerCase().includes(searchLower) ||
          game.cubeID.toLowerCase().includes(searchLower) ||
          game.player1Name.toLowerCase().includes(searchLower) ||
          game.player2Name.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (playerNameLower) {
        const matchesPlayer =
          game.player1Name.toLowerCase().includes(playerNameLower) ||
          game.player2Name.toLowerCase().includes(playerNameLower);
        if (!matchesPlayer) return false;
      }

      if (appliedDate) {
        const gameDate = game.createdAt.substring(0, 10);
        if (gameDate !== appliedDate) return false;
      }

      if (appliedStatus && game.gameState !== appliedStatus) return false;

      return true;
    });
  }, [games, search, appliedPlayerName, appliedDate, appliedStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredGames.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const pagedGames = useMemo(
    () => filteredGames.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredGames, safePage]
  );

  const pagination: Pagination = {
    currentPage: safePage,
    totalPages,
    totalItems: filteredGames.length,
    nextPage: () => setCurrentPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setCurrentPage((p) => Math.max(p - 1, 1)),
    setPage: (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages))),
  };

  const filters: Filters = {
    search,
    setSearch,
    playerNameFilter,
    setPlayerNameFilter,
    dateFilter,
    setDateFilter,
    statusFilter,
    setStatusFilter,
    applyFilters: () => {
      setAppliedPlayerName(playerNameFilter);
      setAppliedDate(dateFilter);
      setAppliedStatus(statusFilter);
      setCurrentPage(1);
    },
    resetFilters: () => {
      setSearch('');
      setPlayerNameFilter('');
      setDateFilter('');
      setStatusFilter('');
      setAppliedPlayerName('');
      setAppliedDate('');
      setAppliedStatus('');
      setCurrentPage(1);
    },
    resetFilters: () => {
      setSearch('');
      setPlayerNameFilter('');
      setDateFilter('');
      setAppliedPlayerName('');
      setAppliedDate('');
      setCurrentPage(1);
    },
  };

  return { games: pagedGames, allGames: games, filteredGames, isLoading, error, pagination, filters };
}
