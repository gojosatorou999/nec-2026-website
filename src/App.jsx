import { useState, useCallback, Suspense } from 'react';
import SequenceLoader from './components/SequenceLoader';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import MentorsSection from './components/MentorsSection';
import DelegationSection from './components/DelegationSection';
import HostsSection from './components/HostsSection';
import Footer from './components/Footer';
import WaterLayer from './components/WaterLayer';
import { useAnchorScroll } from './components/useAnchorScroll';

/*  Page order follows the flow a first-time visitor needs:
    what the event is → who's going → who backs them → who built it.
    About and the roster are hand-off tiles to their own pages; the mentors
    sit below the delegation so the members come before the faculty.  */
function Site() {
  const [ready, setReady] = useState(false);
  useAnchorScroll();
  const handleComplete = useCallback(() => setReady(true), []);

  return (
    <>
      {/* Scroll-driven water caustics, behind everything, click-through */}
      <WaterLayer />

      {!ready && (
        <Suspense fallback={null}>
          <SequenceLoader onComplete={handleComplete} />
        </Suspense>
      )}

      {ready && (
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
          <Navbar />

          <main>
            <HeroSection />
            <AboutSection />
            <DelegationSection />
            <MentorsSection />
            <HostsSection />
          </main>

          <Footer />
        </div>
      )}
    </>
  );
}

export default function App() {
  return <Site />;
}
