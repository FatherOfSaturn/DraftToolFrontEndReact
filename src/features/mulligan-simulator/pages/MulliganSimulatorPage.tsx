import { Footer } from '../../../shared/components/layout/Footer';
import { Header } from '../../../shared/components/layout/Header';
import { DecklistPane } from '../components/DecklistPane';
import { InsightsPane } from '../components/InsightsPane';
import { MulliganZone } from '../components/MulliganZone';
import { useMulliganSimulator } from '../hooks/useMulliganSimulator';

export function MulliganSimulatorPage() {
  const simulator = useMulliganSimulator();

  return (
    <div className="bg-background text-on-surface font-body-md selection:bg-primary-container/30 min-h-screen">
      <Header />
      <main className="w-full max-w-[1600px] mx-auto grid grid-cols-12 gap-gutter pt-24 px-4 md:px-margin-desktop pb-xl">
        <DecklistPane
          decklistText={simulator.decklistText}
          onDecklistTextChange={simulator.setDecklistText}
          onInfuseList={simulator.handleInfuseList}
          loading={simulator.loading}
          deckSize={simulator.deckSize}
          landInOpenerPct={simulator.landInOpenerPct}
          creatureByT3Pct={simulator.creatureByT3Pct}
          interactionLabel={simulator.interactionLabel}
          unknownNames={simulator.unknownNames}
        />

        <MulliganZone
          hand={simulator.hand}
          deckSize={simulator.deckSize}
          librarySize={simulator.librarySize}
          onMulligan={simulator.handleMulligan}
          onDrawCard={simulator.handleDrawCard}
          manaScrewPct={simulator.manaScrewPct}
        />

        <InsightsPane
          categoryCounts={simulator.categoryCounts}
          deckSize={simulator.deckSize}
          wellCategory={simulator.wellCategory}
          onWellCategoryChange={simulator.setWellCategory}
          wellAtLeast={simulator.wellAtLeast}
          onWellAtLeastChange={simulator.setWellAtLeast}
          wellInNext={simulator.wellInNext}
          onWellInNextChange={simulator.setWellInNext}
          wellResult={simulator.wellResult}
        />
      </main>

      <Footer />
    </div>
  );
}
