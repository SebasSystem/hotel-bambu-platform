import Image from 'next/image';

// Temporary placeholder (Phase 1). The narrative home arrives in Phase 3 (task T6).
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-(--container-site) flex-col items-center justify-center gap-8 px-(--gutter) py-(--section-y) text-center">
      <Image
        src="/brand/logo.svg"
        alt="Hotel Bambú Plaza"
        width={314}
        height={80}
        priority
        unoptimized
      />
      <p className="text-xs font-semibold tracking-kicker text-cane-700 uppercase">
        Sitio en construcción
      </p>
      <h1 className="max-w-2xl text-4xl font-semibold text-bamboo-900">
        Estamos preparando nuestro nuevo sitio web
      </h1>
      <p className="max-w-xl text-lg leading-normal text-muted-foreground">
        Muy pronto podrá conocer nuestras habitaciones, servicios y la forma más fácil de
        contactarnos.
      </p>
    </main>
  );
}
