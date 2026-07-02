import { Navigate, useParams } from 'react-router-dom';
import { DraftPage } from './DraftPage';

/**
 * DraftPage itself takes gameID/playerName as plain props rather than
 * reading the router directly — keeps it easier to reuse/test outside
 * a router context. This wrapper is the only thing that knows about
 * useParams.
 */
export function DraftRouteWrapper() {
  const { gameID, playerName } = useParams<{ gameID: string; playerName: string }>();

  if (!gameID || !playerName) {
    return <Navigate to="/draft-setup" replace />;
  }

  return <DraftPage gameID={decodeURIComponent(gameID)} playerName={decodeURIComponent(playerName)} />;
}
