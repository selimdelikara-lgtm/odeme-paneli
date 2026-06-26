import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Bize Ulaşın | Ödedimi",
  description:
    "Ödedimi.com ile ilgili görüş, öneri, şikayet ve destek taleplerinizi bize iletebilirsiniz.",
  alternates: {
    canonical: "/bize-ulasin",
  },
};

export default function ContactPage() {
  return (
    <main className="contact-page">
      <section className="contact-shell">
        <div className="contact-copy">
          <Link href="/" className="contact-brand">Ödedimi</Link>
          <span className="contact-pill">Destek ve geri bildirim</span>
          <h1>Bize Ulaşın</h1>
          <p>
            Ödedimi.com ile ilgili görüş, öneri, şikayet ve destek taleplerinizi bize iletebilirsiniz.
          </p>
          <div className="contact-note">
            Ödedimi.com deneyiminizi iyileştirmek için geri bildirimlerinizi önemsiyoruz. Mesajınızı bize iletin, en kısa sürede inceleyelim.
          </div>
        </div>
        <ContactForm />
      </section>
    </main>
  );
}
