import Slideshow from '../components/Slideshow';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-6xl aspect-video relative">
        <Slideshow />
      </div>
    </main>
  );
}
