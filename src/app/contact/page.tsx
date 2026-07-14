import type { Metadata } from "next";
import ContactContent from "./ContactContent";

export const metadata: Metadata = {
  title: "Contact — Commission Your Bespoke Piece",
  description: "Get in touch with Artiziva Homes to commission a bespoke epoxy & resin masterpiece. Share your vision and we'll craft something truly one-of-one.",
};

export default function ContactPage() {
  return <ContactContent />;
}
