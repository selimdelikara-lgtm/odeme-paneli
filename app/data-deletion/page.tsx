import type { Metadata } from "next";
import { LegalPage } from "../_components/LegalPage";

export const metadata: Metadata = {
  title: "User Data Deletion",
  description: "Instructions for deleting Odedimi account and user data.",
  alternates: {
    canonical: "/data-deletion",
  },
};

export default function DataDeletionPage() {
  return (
    <LegalPage
      title="User Data Deletion"
      description="Use these instructions to request deletion of your Odedimi account and related data."
    >
      <section>
        <h2>Delete your data</h2>
        <p>
          To delete your account data, sign in to Odedimi and use the account settings
          deletion option if available.
        </p>
      </section>
      <section>
        <h2>Manual deletion request</h2>
        <p>
          If you cannot access your account, contact the Odedimi site owner with the
          email address or OAuth account used for login and request data deletion.
        </p>
      </section>
      <section>
        <h2>What gets deleted</h2>
        <p>
          Account-related project records, payment records, invoice metadata and stored
          attachments associated with the user can be removed after verification.
        </p>
      </section>
      <section>
        <h2>Processing</h2>
        <p>
          Deletion requests are reviewed and processed after account ownership is
          verified.
        </p>
      </section>
    </LegalPage>
  );
}
