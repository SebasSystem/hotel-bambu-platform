import { redirect } from 'next/navigation';

/** FAQ and policies share one admin page since C3 merged them on the public site. */
export default function FaqPage() {
  redirect('/admin/policies#preguntas');
}
