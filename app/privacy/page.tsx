import type { Metadata } from "next";
import { LegalPage } from "../_components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Odedimi privacy policy for account, project and payment tracking data.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="This page explains how Odedimi handles account, project, invoice and payment tracking data."
    >
      <section>
        <h2>Data we collect</h2>
        <p>
          Odedimi stores the account information required for login and the project,
          payment, invoice and attachment records users create inside the application.
        </p>
      </section>
      <section>
        <h2>How we use data</h2>
        <p>
          Data is used only to provide payment tracking, invoice tracking, export,
          profile and account management features to the signed-in user.
        </p>
      </section>
      <section>
        <h2>Third-party login</h2>
        <p>
          Users may sign in with supported OAuth providers such as Google or Facebook.
          OAuth providers may share basic profile information needed to authenticate
          the user.
        </p>
      </section>
      <section>
        <h2>Data deletion</h2>
        <p>
          Users can request account and data deletion from the data deletion page or
          by contacting the site owner.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>For privacy requests, contact the Odedimi site owner.</p>
      </section>
    </LegalPage>
  );
}
