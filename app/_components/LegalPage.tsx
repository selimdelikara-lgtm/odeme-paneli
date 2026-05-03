import type { ReactNode } from "react";
import Link from "next/link";

type LegalPageProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function LegalPage({ title, description, children }: LegalPageProps) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#F4F7FB",
        color: "#172033",
        fontFamily: 'var(--font-sans), "Satoshi", "Inter", Arial, sans-serif',
        padding: "48px 20px",
      }}
    >
      <article
        style={{
          maxWidth: 860,
          margin: "0 auto",
          background: "#FFFFFF",
          border: "1px solid #E3EAF4",
          borderRadius: 24,
          boxShadow: "0 24px 70px rgba(15,23,42,0.08)",
          padding: "36px",
        }}
      >
        <Link
          href="/"
          style={{
            color: "#2563EB",
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          Odedimi
        </Link>
        <h1
          style={{
            margin: "24px 0 10px",
            fontSize: "clamp(32px, 5vw, 54px)",
            lineHeight: 1,
            letterSpacing: "-1.6px",
            fontWeight: 950,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            margin: "0 0 28px",
            color: "#64748B",
            fontSize: 17,
            lineHeight: 1.7,
            fontWeight: 650,
          }}
        >
          {description}
        </p>
        <div
          style={{
            display: "grid",
            gap: 18,
            color: "#334155",
            fontSize: 16,
            lineHeight: 1.75,
          }}
        >
          {children}
        </div>
      </article>
    </main>
  );
}
