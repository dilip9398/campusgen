import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BookOpen } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const terms = [
  { term: "Cuffing Season", type: "THE COZY ONE", meaning: "That semester-long pull toward a plus-one for chai runs, late lectures and the walk back from the library. Warmth, with intention." },
  { term: "Long Term / Serious", type: "HERE FOR THE REAL THING", meaning: "You’re open to building something steady and meaningful. No need to speed-run it; consistency gets the first date." },
  { term: "Situationship", type: "UNDEFINED, NOT UNCONSIDERED", meaning: "There’s chemistry, but the label conversation hasn’t happened. Keep checking in with each other so ‘undefined’ doesn’t turn into ‘unclear.’" },
  { term: "Benching / Roster Dating", type: "KEEP IT HONEST", meaning: "Meeting more than one person casually while you figure out what clicks. Be upfront about it; nobody signed up to be a secret backup." },
  { term: "Dating & Outings", type: "OUT OF THE GROUP CHAT", meaning: "You’re here for actual plans: campus coffee, street-food detours, a film, or exploring somewhere new together." },
  { term: "Study Buddy & Chill", type: "ACADEMIC CHEMISTRY", meaning: "Shared notes, parallel focus, mutual deadlines. Maybe there’s a spark; maybe you’ve just found a great project partner." },
  { term: "Live-in / Flatmate Vibe", type: "A CLOSE DAILY CONNECTION", meaning: "Looking for a deep, everyday bond and openness to co-living harmony. Talk about boundaries and expectations early." },
  { term: "Friends First / Platonic", type: "NO PRESSURE, GOOD COMPANY", meaning: "Start with a real friendship and let connection take its own shape. A ‘no’ to romance is still a full, worthwhile yes to friendship." },
  { term: "Ghosting", type: "THE VANISHING ACT", meaning: "When someone suddenly stops replying without saying they’re done. If you need to leave, a clear and kind message is better than silence." },
  { term: "Caspering", type: "THE KIND EXIT", meaning: "A friendly, direct close instead of disappearing. A short ‘I don’t feel a romantic connection, but I wish you well’ can save everyone a week of guessing." },
  { term: "Love Bombing", type: "BIG INTENSITY, EARLY ON", meaning: "Overwhelming affection or promises used to rush closeness or control. You’re allowed to slow things down and keep your boundaries." },
];

export default function LexiconPage() {
  return <>
    <Navbar />
    <main className="lexicon-page">
      <div className="lexicon-hero"><span className="eyebrow"><BookOpen size={14} /> THE CAMPUS KIN FIELD GUIDE</span><h1>The vibe<br /><em>dictionary.</em></h1><p>Dating language gets weird fast. Here’s what we mean when we ask what you’re looking for.</p><Link className="text-link" href="/auth">Set up your profile <ArrowUpRight size={16} /></Link></div>
      <div className="lexicon-list">{terms.map((entry, index) => <article className="lexicon-entry" key={entry.term}><span className="lexicon-index">{String(index + 1).padStart(2, "0")}</span><div><span className="eyebrow">{entry.type}</span><h2>{entry.term}</h2><p>{entry.meaning}</p></div></article>)}</div>
      <div className="lexicon-close"><span>Clear is kind.</span><Link href="/">Back to campus kin <ArrowLeft size={15} /></Link></div>
    </main>
  </>;
}
