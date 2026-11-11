import { createFileRoute } from "@tanstack/react-router";
import SmoothScroll from "@/components/SmoothScroll";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Profile from "@/components/Profile";
import Collection from "@/components/Collection";
import Statement from "@/components/Statement";
import Closing from "@/components/Closing";
import Footer from "@/components/Footer";

const description =
  "Mystic Scents is a juicy fragrance world: Strawberry, Watermelon, Blueberry and Peach — four moods, one scent universe. Wear the moment.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MYSTIC SCENTS — WEAR THE MOMENT." },
      { name: "description", content: description },
      { property: "og:title", content: "MYSTIC SCENTS — WEAR THE MOMENT." },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "MYSTIC SCENTS — WEAR THE MOMENT." },
      { name: "twitter:description", content: description },
    ],
  }),
  component: MysticScentsHome,
});

function MysticScentsHome() {
  return (
    <SmoothScroll>
      <Navbar />
      <main>
        <Hero />
        <Profile />
        <Collection />
        <Statement />
        <Closing />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
