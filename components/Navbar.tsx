import Link from "next/link";
import { ArrowUpRight, BookOpen, Compass, Heart, LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";

export function Navbar({ signedIn = false }: { signedIn?: boolean }) {
  return <header className="site-header"><div className="nav-inner">
    <Link href="/" className="wordmark"><span className="wordmark-mark">c.</span> campus kin</Link>
    <nav className="main-nav" aria-label="Main navigation">
      <Link href="/feed"><Compass size={16} aria-hidden="true" /><span>Discover</span></Link>
      <Link href="/matches"><Heart size={16} aria-hidden="true" /><span>Matches</span></Link>
      <Link href="/lexicon"><BookOpen size={16} aria-hidden="true" /><span>Vibe bible</span></Link>
    </nav>
    {signedIn ? <form action={signOut}><button type="submit" className="nav-action" aria-label="Sign out" title="Sign out"><LogOut size={17} /></button></form> : <Link className="nav-cta" href="/auth">Get started <ArrowUpRight size={15} /></Link>}
  </div></header>;
}
