import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { Newspaper, Map as MapIcon, ShoppingBag, ShieldAlert, MessageCircle, Lock, Heart, CalendarDays, Search, ArrowRight } from 'lucide-react';
import { authOptions } from '@/lib/auth';

const FEATURES = [
  { icon: Newspaper, title: 'Neighborhood feed', text: 'News, questions, recommendations and lost & found from people within walking distance.', color: 'bg-sky-100 text-sky-600' },
  { icon: CalendarDays, title: 'Local events', text: 'Garage sales, meetups, clean-ups and celebrations happening around the corner.', color: 'bg-violet-100 text-violet-600' },
  { icon: ShoppingBag, title: 'Buy, sell & give away', text: 'A free local marketplace with no fees. Declutter, find bargains, keep things out of landfill.', color: 'bg-emerald-100 text-emerald-600' },
  { icon: ShieldAlert, title: 'Emergency alerts', text: 'Real-time alerts from neighbors plus official emergency numbers for your country.', color: 'bg-red-100 text-red-600' },
  { icon: MapIcon, title: 'Live map', text: 'See everything happening nearby on an interactive map.', color: 'bg-amber-100 text-amber-600' },
  { icon: MessageCircle, title: 'Private messages', text: 'Chat directly with sellers and neighbors without sharing your phone number.', color: 'bg-teal-100 text-teal-600' },
];

const STEPS = [
  { icon: Search, title: 'Set your neighborhood', text: 'Use your location or search for your area. We only ever show your neighborhood, never your address.' },
  { icon: Heart, title: 'Join the conversation', text: 'Post updates, ask for recommendations, list items and help neighbors.' },
  { icon: ShieldAlert, title: 'Stay informed & safe', text: 'Get notified about emergencies near you and find help fast.' },
];

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/feed');

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-community-50 via-white to-marketplace-50" />
        <div className="relative max-w-5xl mx-auto px-5 pt-14 pb-16 lg:pt-24 lg:pb-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white border border-community-200 px-3 py-1 text-xs font-semibold text-community-700 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-marketplace-500" /> Free for everyone, forever
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900">
            Your neighborhood,
            <span className="block bg-gradient-to-r from-community-500 to-marketplace-500 bg-clip-text text-transparent">connected.</span>
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">
            LocalVibe brings neighbors together: share what&apos;s happening, buy and sell locally, discover events and get help when it matters most.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 rounded-xl bg-community-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-community-500/25 hover:bg-community-600">
              Join your neighborhood <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/feed" className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-800 hover:bg-gray-50">
              Look around first
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Already a member? <Link href="/auth/signin" className="font-semibold text-community-600">Sign in</Link>
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">Everything local, in one place</h2>
        <p className="mt-2 text-gray-600 text-center">No ads cluttering your feed. No algorithms deciding what matters.</p>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, text, color }) => (
            <div key={title} className="rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6" />
              </span>
              <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
              <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-5 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">Get started in a minute</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-8">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <div key={title} className="text-center">
                <div className="relative mx-auto w-14 h-14 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                  <Icon className="w-6 h-6 text-community-500" />
                  <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-community-500 text-white text-xs font-bold flex items-center justify-center">{index + 1}</span>
                </div>
                <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
                <p className="mt-1.5 text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="w-11 h-11 rounded-xl bg-gray-900 text-white flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-900">Privacy and safety built in</h2>
            <ul className="mt-4 space-y-2.5 text-gray-600">
              <li>• Only your neighborhood is shown, never your exact location.</li>
              <li>• Message people without sharing your phone number or email.</li>
              <li>• Report and block tools, with human moderators reviewing reports.</li>
              <li>• Download or delete your data at any time.</li>
            </ul>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-community-500 to-marketplace-500 p-8 text-white shadow-xl">
            <p className="text-2xl font-bold">Ready to meet your neighbors?</p>
            <p className="mt-2 opacity-90">It&apos;s free, takes less than a minute, and your community is waiting.</p>
            <Link href="/auth/signup" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 font-semibold text-community-700 hover:bg-gray-50">
              Create your free account <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200">
        <div className="max-w-5xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} LocalVibe</p>
          <nav className="flex gap-5">
            <Link href="/guidelines" className="hover:text-gray-800">Community Guidelines</Link>
            <Link href="/terms" className="hover:text-gray-800">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-800">Privacy</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
