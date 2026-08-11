import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { env } from '../config/env';
import { AccountPage } from '../features/account/pages/AccountPage';
import { AuthProvider } from '../features/auth/AuthContext';
import { RequireAuth } from '../features/auth/RequireAuth';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { DeckBuilderPage } from '../features/deck-builder/pages/DeckBuilderPage';
import { DraftRouteWrapper } from '../features/draft/pages/DraftRouteWrapper';
import { ClassicDraftRouteWrapper } from '../features/draft/pages/ClassicDraftRouteWrapper';
import { DraftSelectionPage } from '../features/draft/pages/DraftSelectionPage';
import { DraftSetupPage } from '../features/draft/pages/DraftSetupPage';
import { ClassicDraftSetupPage } from '../features/draft/pages/ClassicDraftSetupPage';
import type { RitualDefinition } from '../features/draft/pages/DraftSelectionPage';
import { FeatureRequestPage } from '../features/feature-requests/pages/FeatureRequestPage';
import { AdminPage } from '../features/admin/pages/AdminPage';
import { HomePage } from '../features/home/pages/HomePage';
import { MulliganSimulatorPage } from '../features/mulligan-simulator/pages/MulliganSimulatorPage';
import { ScrollToTop } from '../shared/components/ScrollToTop';
import { ToastProvider } from '../shared/components/Toast';
import { ThemeProvider } from '../shared/theme/ThemeContext';

/**
 * Route table:
 *   /                              HomePage
 *   /draft-selection               DraftSelectionPage (choose a draft mode)
 *   /draft-setup                   DraftSetupPage (create or join pyramid draft)
 *   /draft-setup/classic           ClassicDraftSetupPage (create or join classic draft)
 *   /draft/:gameID/:playerName     DraftPage (the live draft board), via DraftRouteWrapper
 *   /classic-draft/:gameID/:playerName   ClassicDraftPage (the classic draft board), via ClassicDraftRouteWrapper
 *   /deckbuilder/:gameID?/:playerName?   DeckBuilderPage (params optional — see its own docs)
 *   /account                       AccountPage
 *   /mulligan-simulator            MulliganSimulatorPage
 *   /login                         LoginPage
 *   *                              redirects to /
 *
 * The three *Route wrapper functions below exist only so their pages can
 * take a plain callback prop (onSelectRitual, onEnterDraft, etc.)
 * instead of depending on react-router directly — keeps those page
 * components easier to reuse or test outside a router.
 */
export function App() {
  return (
    <GoogleOAuthProvider clientId={env.googleClientId}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <ScrollToTop />
          <ToastProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/draft-selection" element={<DraftSelectionRoute />} />
              <Route path="/draft-setup" element={<DraftSetupRoute />} />
              <Route path="/draft-setup/classic" element={<ClassicDraftSetupRoute />} />
              <Route path="/draft/:gameID/:playerName" element={<DraftRouteWrapper />} />
              <Route path="/classic-draft/:gameID/:playerName" element={<ClassicDraftRouteWrapper />} />
              <Route path="/deckbuilder/:gameID?/:playerName?" element={<DeckBuilderPage />} />
              <Route
                path="/account"
                element={
                  env.skipAuth ? (
                    <AccountPage />
                  ) : (
                    <RequireAuth>
                      <AccountPage />
                    </RequireAuth>
                  )
                }
              />
              <Route path="/mulligan-simulator" element={<MulliganSimulatorPage />} />
              <Route path="/feature-requests" element={<FeatureRequestPage />} />
              <Route
                path="/admin"
                element={
                  env.skipAuth ? (
                    <AdminPage />
                  ) : (
                    <RequireAuth>
                      <AdminPage />
                    </RequireAuth>
                  )
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </BrowserRouter>
      </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

// Draft mode selection routes each ritual card to the appropriate setup flow.
function DraftSelectionRoute() {
  const navigate = useNavigate();
  return (
    <DraftSelectionPage
      onSelectRitual={(ritual: RitualDefinition) => {
        if (ritual.id === 'planeswalkers-trial') {
          navigate('/draft-setup/classic');
        } else {
          navigate('/draft-setup');
        }
      }}
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

function ClassicDraftSetupRoute() {
  const navigate = useNavigate();
  return (
    <ClassicDraftSetupPage
      onEnterDraft={(gameID, playerName) =>
        navigate(`/classic-draft/${encodeURIComponent(gameID)}/${encodeURIComponent(playerName)}`)
      }
    />
  );
}
