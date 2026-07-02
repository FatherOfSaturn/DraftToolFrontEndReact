import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { DraftSetupPage } from './pages/DraftSetupPage';
import { HomePage } from './pages/HomePage';
import { DraftRouteWrapper } from './pages/DraftRouteWrapper';
import { AccountPage } from './pages/AccountPage';
import { DraftSelectionPage } from './components/draft-selection/DraftSelectionPage';
import { MulliganSimulatorPage } from './components/mulligan-simulator/MulliganSimulatorPage';
import { LoginPortalPage } from './pages/LoginPortalPage';
import { DeckBuilderPage } from './pages/DeckBuilderPage';

/**
 * Route table:
 *   /                              HomePage
 *   /draft-selection               DraftSelectionPage (choose a draft mode)
 *   /draft-setup                   DraftSetupPage (create or join a game)
 *   /draft/:gameID/:playerName     DraftPage (the live draft board), via DraftRouteWrapper
 *   /deckbuilder/:gameID?/:playerName?   DeckBuilderPage (params optional — see its own docs)
 *   /account                       AccountPage
 *   /mulligan-simulator            MulliganSimulatorPage
 *   /login                         LoginPortalPage
 *   *                              redirects to /
 *
 * The two *Route wrapper functions below exist only so their pages can
 * take a plain callback prop (onSelectRitual, onEnterDraft, etc.)
 * instead of depending on react-router directly — keeps those page
 * components easier to reuse or test outside a router.
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/draft-selection" element={<DraftSelectionRoute />} />
        <Route path="/draft-setup" element={<DraftSetupRoute />} />
        <Route path="/draft/:gameID/:playerName" element={<DraftRouteWrapper />} />
        <Route path="/deckbuilder/:gameID?/:playerName?" element={<DeckBuilderPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/mulligan-simulator" element={<MulliganSimulatorPage />} />
        <Route path="/login" element={<LoginPortalPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// No real cube-selection wiring exists yet (confirmed: START DRAFT and
// "Manifest New Ritual" are both inert by design for now), so both
// callbacks just navigate on to Draft Setup — same destination either
// way until there's a real mechanism to carry the chosen ritual/cube ID
// forward into that form.
function DraftSelectionRoute() {
  const navigate = useNavigate();
  return (
    <DraftSelectionPage
      onSelectRitual={() => navigate('/draft-setup')}
      onCreateNewRitual={() => navigate('/draft-setup')}
    />
  );
}

// Thin wrapper so DraftSetupPage's onEnterDraft callback can call the real
// router's navigate() instead of taking a navigate function as a prop.
function DraftSetupRoute() {
  const navigate = useNavigate();
  return (
    <DraftSetupPage
      onEnterDraft={(gameID, playerName) =>
        navigate(`/draft/${encodeURIComponent(gameID)}/${encodeURIComponent(playerName)}`)
      }
    />
  );
}
