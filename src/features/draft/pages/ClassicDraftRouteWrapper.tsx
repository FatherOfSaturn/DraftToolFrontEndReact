import { Navigate, useParams } from 'react-router-dom';
import { ClassicDraftPage } from './ClassicDraftPage';

/**
 * ClassicDraftPage takes gameID/playerName as plain props rather than
 * reading the router directly. This wrapper is the only thing that knows
 * about useParams (mirrors DraftRouteWrapper for the classic route).
 */
export function ClassicDraftRouteWrapper() {
  const { gameID, playerName } = useParams<{ gameID: string; playerName: string }>();

  if (!gameID || !playerName) {
    return <Navigate to="/draft-selection" replace />;
  }

  return <ClassicDraftPage gameID={gameID} playerName={playerName} />;
}
