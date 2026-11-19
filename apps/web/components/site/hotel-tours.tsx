'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { container } from './styles';

const tours = [
  {
    id: 'recorrido-recepcion',
    title: 'La llegada',
    description: 'La entrada, la recepción y la sala de espera.',
    duration: '10 segundos',
    width: 464,
    height: 832,
  },
  {
    id: 'recorrido-habitacion',
    title: 'La habitación',
    description: 'Las camas, el mobiliario y el acceso al baño.',
    duration: '17 segundos',
    width: 480,
    height: 848,
  },
];

function Tour({ tour }: { tour: (typeof tours)[number] }) {
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <article className="hotel-tour">
      <div className="hotel-tour-media">
        {started ? (
          <video
            autoPlay
            controls
            playsInline
            muted
            preload="none"
            width={tour.width}
            height={tour.height}
            poster={`/media/${tour.id}.jpg`}
            aria-label={`Recorrido: ${tour.title}`}
            onError={() => setFailed(true)}
          >
            <source src={`/media/${tour.id}.webm`} type="video/webm" />
            <source src={`/media/${tour.id}.mp4`} type="video/mp4" />
          </video>
        ) : (
          <button
            type="button"
            className="hotel-tour-play"
            onClick={() => setStarted(true)}
            aria-label={`Ver recorrido: ${tour.title}, ${tour.duration}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/media/${tour.id}.jpg`}
              alt=""
              width={tour.width}
              height={tour.height}
              loading="lazy"
            />
            <span>
              <Play aria-hidden="true" className="size-5" /> Ver recorrido
            </span>
          </button>
        )}
      </div>
      <div className="hotel-tour-copy">
        <h3>{tour.title}</h3>
        <p>{tour.description}</p>
        <span className="text-sm text-muted-foreground">{tour.duration} · Video del hotel</span>
        {failed ? (
          <p role="status">
            No se pudo reproducir aquí.{' '}
            <a className="underline" href={`/media/${tour.id}.mp4`}>
              Abrir video
            </a>
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function HotelTours() {
  return (
    <section id="recorridos" aria-labelledby="recorridos-title" className="hotel-tours-section">
      <div className={container}>
        <div className="hotel-section-intro">
          <h2 id="recorridos-title">
            Conoce el hotel
            <br />
            antes de llegar.
          </h2>
          <p>
            Abre la puerta, recorre la recepción y entra en una habitación. Dos videos breves para
            que veas los espacios a tu ritmo.
          </p>
        </div>
        <div className="hotel-tours-grid">
          {tours.map((tour) => (
            <Tour key={tour.id} tour={tour} />
          ))}
        </div>
      </div>
    </section>
  );
}
