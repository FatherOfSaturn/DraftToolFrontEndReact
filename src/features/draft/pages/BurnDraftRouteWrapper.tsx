import { Navigate, useParams } from 'react-router-dom';
import { BurnDraftPage } from './BurnDraftPage';

/**
 * BurnDraftPage takes gameID/playerName as plain props rather than reading the
 * router directly. This wrapper is the only thing that knows about useParams
 * (mirrors DraftRouteWrapper / ClassicDraftRouteWrapper).
 */
export function BurnDraftRouteWrapper() {
  const { gameID, playerName } = useParams<{ gameID: string; playerName: string }>();

  if (!gameID || !playerName) {
    return <Navigate to="/draft-selection" replace />;
  }

  return <BurnDraftPage gameID={gameID} playerName={playerName} />;
}
