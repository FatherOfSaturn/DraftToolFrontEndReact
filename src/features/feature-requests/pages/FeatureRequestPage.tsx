import { Header } from '../../../shared/components/layout/Header';
import { Footer } from '../../../shared/components/layout/Footer';
import { FeatureRequestForm } from '../components/FeatureRequestForm';
import { DonatorsPrioritizedCard } from '../components/DonatorsPrioritizedCard';
import { FeatureBacklog } from '../components/FeatureBacklog';

export function FeatureRequestPage() {
  return (
    <div className="font-body-md text-body-md bg-background min-h-screen">
      <Header />
      <main className="pt-16 px-margin-mobile md:px-margin-desktop pb-xl">
        <div className="max-w-6xl mx-auto">
          <div className="mb-lg">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-xs">Request New Features</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Help shape the future of Pyramid Draft by submitting your ideas below.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
            <div className="lg:col-span-8">
              <FeatureRequestForm />
            </div>
            <div className="lg:col-span-4 flex flex-col gap-md">
              <DonatorsPrioritizedCard />
              <FeatureBacklog />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
