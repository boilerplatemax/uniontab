'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, Shield, Zap, Mail, Vote, Database, BarChart3, Calendar, Lock, CheckCircle2, Clock, FileCheck, UserCheck, Video, Menu, X, Eye, TrendingDown, Timer, ChevronDown } from 'lucide-react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/i18n';
import { LanguageToggle } from '@/components/ui/language-toggle';

function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { t } = useLanguage();
  const landing = t.landing;

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity group">
              <div className="relative">
                <Users className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" />
                <div className="absolute -inset-1 bg-blue-600/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                UnionTab
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center gap-2 sm:gap-4">
              <Link href="/features">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  {landing.nav.features}
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  {landing.nav.pricing}
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  {landing.nav.about}
                </Button>
              </Link>
              <Link href="/blogs">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  {landing.nav.blog}
                </Button>
              </Link>
              <Link href="/contact">
                <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                  {landing.nav.contact}
                </Button>
              </Link>
              <LanguageToggle variant="pill" />
              <Link href="/member-login">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  {landing.nav.memberLogin}
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all">
                  {landing.nav.getStarted}
                </Button>
              </Link>
            </div>

            {/* Mobile */}
            <div className="flex sm:hidden items-center gap-2">
              <Link href="/sign-up">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                  {landing.nav.getStarted}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden bg-white border-t"
            >
              <div className="px-4 py-4 space-y-3">
                {[
                  { href: '/features', label: landing.nav.features },
                  { href: '/pricing', label: landing.nav.pricing },
                  { href: '/about', label: landing.nav.about },
                  { href: '/blogs', label: landing.nav.blog },
                  { href: '/contact', label: landing.nav.contact },
                ].map(({ href, label }) => (
                  <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-blue-600">
                      {label}
                    </Button>
                  </Link>
                ))}
                <div className="pt-3 border-t">
                  <Link href="/member-login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
                      {landing.nav.memberLogin}
                    </Button>
                  </Link>
                </div>
                <div className="pt-3 border-t flex items-center justify-between">
                  <span className="text-sm text-gray-600">Language</span>
                  <LanguageToggle variant="pill" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── HERO — Full Screen ─── */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#0c1628]">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <Image
            src="/assets/landing/hero-workers.jpg"
            alt=""
            fill
            className="object-cover object-center opacity-25"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c1628]/60 via-[#0c1628]/75 to-[#0c1628]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="space-y-8"
          >
            {/* Badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 text-sm text-violet-300 font-medium backdrop-blur-sm">
                <Zap className="h-4 w-4" />
                {landing.hero.badge}
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight">
              <span className="block">{landing.hero.title.line1}</span>
              <span className="block text-violet-400">{landing.hero.title.highlight}</span>
              <span className="block">{landing.hero.title.line3}</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              {landing.hero.subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="h-14 sm:h-16 px-8 sm:px-12 text-base sm:text-lg bg-violet-500 hover:bg-violet-400 text-white font-bold shadow-2xl transition-all transform hover:scale-105 rounded-full"
                >
                  {landing.hero.cta.startFree}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/cupe100" target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  className="h-14 sm:h-16 px-8 sm:px-12 text-base sm:text-lg bg-white text-violet-700 hover:bg-violet-50 font-semibold rounded-full transition-all shadow-lg"
                >
                  <Eye className="mr-2 h-5 w-5" />
                  {landing.hero.cta.seeFeatures}
                </Button>
              </Link>
            </div>

            <p className="text-sm text-slate-400">
              {landing.hero.disclaimer}
            </p>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          >
            <ChevronDown className="h-8 w-8 text-white/30" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── ROI STATS STRIP ─── */}
      <section className="bg-slate-900 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
            {[
              { stat: landing.roi.stat1, icon: Clock },
              { stat: landing.roi.stat2, icon: Zap },
              { stat: landing.roi.stat3, icon: TrendingDown },
              { stat: landing.roi.stat4, icon: Timer },
            ].map(({ stat, icon: Icon }, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="text-center space-y-3">
                  <Icon className="h-7 w-7 text-violet-400/60 mx-auto" />
                  <div className="text-4xl sm:text-5xl font-bold text-violet-400">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-slate-400 uppercase tracking-widest leading-snug">
                    {stat.label}
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VALUE STATEMENT — For Executives ─── */}
      <section className="bg-[#0f2540] py-24 lg:py-36">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <AnimatedSection>
              <div className="space-y-8">
                <p className="text-violet-400 font-semibold uppercase tracking-widest text-sm">
                  For Union Executives
                </p>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  {landing.roi.headline}
                </h2>
                <p className="text-lg sm:text-xl text-slate-300 leading-relaxed">
                  {landing.roi.body}
                </p>
                <ul className="space-y-4 pt-2">
                  {landing.roi.points.map((point, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-slate-300">{point}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-4">
                  <Link href="/sign-up">
                    <Button
                      size="lg"
                      className="h-14 px-10 text-base bg-violet-500 hover:bg-violet-400 text-white font-bold rounded-full shadow-xl transition-all hover:scale-105"
                    >
                      {landing.hero.cta.startFree}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="relative">
                <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <Image
                    src="/assets/landing/save-hours.png"
                    alt="UnionTab dashboard showing time savings for union executives"
                    width={640}
                    height={480}
                    className="w-full h-auto"
                  />
                </div>
                {/* Floating stat card */}
                <div className="absolute -bottom-6 -right-4 sm:-right-8 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-5 hidden sm:block">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-violet-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">15+ hrs</p>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">saved per month</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── FEATURE BLOCK 1 — Secure Elections (white bg) ─── */}
      <section className="bg-white py-24 lg:py-36 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <AnimatedSection>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
                <Image
                  src="/assets/features/elections.png"
                  alt="Secure voting interface"
                  width={640}
                  height={480}
                  className="w-full h-auto"
                />
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-4 py-1.5 text-sm font-semibold">
                  <Vote className="h-4 w-4" />
                  {landing.features.elections.eyebrow}
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                  {landing.features.elections.title}
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {landing.features.elections.description}
                </p>
                <ul className="space-y-3 pt-2">
                  {landing.features.elections.points.map((point, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-700">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── FEATURE BLOCK 2 — Communications (dark navy bg) ─── */}
      <section className="bg-[#0c1628] py-24 lg:py-36 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <AnimatedSection>
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 rounded-full px-4 py-1.5 text-sm font-semibold border border-indigo-500/30">
                  <Mail className="h-4 w-4" />
                  {landing.features.communications.eyebrow}
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
                  {landing.features.communications.title}
                </h2>
                <p className="text-lg text-slate-300 leading-relaxed">
                  {landing.features.communications.description}
                </p>
                <ul className="space-y-3 pt-2">
                  {landing.features.communications.points.map((point, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-300">
                      <CheckCircle2 className="h-5 w-5 text-violet-400 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <Image
                  src="/assets/features/communications.png"
                  alt="Mass communications interface"
                  width={640}
                  height={480}
                  className="w-full h-auto"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── FEATURE BLOCK 3 — Analytics (off-white / light bg) ─── */}
      <section className="bg-slate-50 py-24 lg:py-36 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <AnimatedSection>
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
                <Image
                  src="/assets/features/analytics.png"
                  alt="Analytics dashboard"
                  width={640}
                  height={480}
                  className="w-full h-auto"
                />
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-cyan-50 text-cyan-700 rounded-full px-4 py-1.5 text-sm font-semibold">
                  <BarChart3 className="h-4 w-4" />
                  {landing.features.analytics.eyebrow}
                </div>
                <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                  {landing.features.analytics.title}
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {landing.features.analytics.description}
                </p>
                <ul className="space-y-3 pt-2">
                  {landing.features.analytics.points.map((point, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-700">
                      <CheckCircle2 className="h-5 w-5 text-cyan-600 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── MORE FEATURES GRID ─── */}
      <section className="bg-white py-24 lg:py-32">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900">
                {landing.features.title}
              </h2>
              <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                {landing.features.subtitle}
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                color: 'bg-purple-600',
                lightColor: 'bg-purple-50',
                textColor: 'text-purple-700',
                imgSrc: '/assets/features/member-portal.png',
                title: landing.features.memberPortal.title,
                description: landing.features.memberPortal.description,
                points: landing.features.memberPortal.points,
                dotColor: 'bg-purple-600',
              },
              {
                icon: Database,
                color: 'bg-emerald-600',
                lightColor: 'bg-emerald-50',
                textColor: 'text-emerald-700',
                imgSrc: '/assets/features/documents.png',
                title: landing.features.storage.title,
                description: landing.features.storage.description,
                points: landing.features.storage.points,
                dotColor: 'bg-emerald-600',
              },
              {
                icon: Calendar,
                color: 'bg-pink-600',
                lightColor: 'bg-pink-50',
                textColor: 'text-pink-700',
                imgSrc: '/assets/features/events.png',
                title: landing.features.events.title,
                description: landing.features.events.description,
                points: landing.features.events.points,
                dotColor: 'bg-pink-600',
              },
            ].map(({ icon: Icon, color, lightColor, textColor, imgSrc, title, description, points, dotColor }, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="group rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col bg-white">
                  <div className="relative h-44 overflow-hidden bg-gray-50">
                    <Image src={imgSrc} alt={title} fill className="object-cover object-top" />
                  </div>
                  <div className="p-7 flex flex-col flex-grow space-y-4">
                    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center shadow-md -mt-10 border-4 border-white relative z-10`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <p className="text-gray-500 leading-relaxed flex-grow">{description}</p>
                    <ul className="space-y-2 pt-2">
                      {points.map((point, j) => (
                        <li key={j} className="flex items-center gap-2.5 text-sm text-gray-600">
                          <div className={`w-1.5 h-1.5 ${dotColor} rounded-full flex-shrink-0`} />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-[#0c1628] py-24 lg:py-32">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold text-white">
                {landing.howItWorks.title}
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                {landing.howItWorks.subtitle}
              </p>
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              { step: '1', color: 'bg-blue-600', data: landing.howItWorks.steps.step1, img: '/assets/landing/step-1-profile.png', alt: 'Profile setup' },
              { step: '2', color: 'bg-indigo-600', data: landing.howItWorks.steps.step2, img: '/assets/landing/step-2-import.png', alt: 'Member import' },
              { step: '3', color: 'bg-violet-500', data: landing.howItWorks.steps.step3, img: '/assets/landing/step-3-dashboard.png', alt: 'Dashboard' },
            ].map(({ step, color, data, img, alt }, i) => (
              <AnimatedSection key={i} delay={i * 0.15}>
                <div className="text-center space-y-5 flex flex-col items-center">
                  <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <span className="text-2xl font-bold text-white">{step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{data.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{data.description}</p>
                  <div className="relative w-full h-44 rounded-xl overflow-hidden shadow-lg border border-white/10">
                    <Image src={img} alt={alt} fill className="object-cover object-top" />
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECURITY ─── */}
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                {landing.security.title}
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                {landing.security.subtitle}
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50', data: landing.security.encryption },
              { icon: FileCheck, color: 'text-indigo-600', bg: 'bg-indigo-50', data: landing.security.auditTrails },
              { icon: Lock, color: 'text-purple-600', bg: 'bg-purple-50', data: landing.security.anonymousVoting },
              { icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50', data: landing.security.uptime },
            ].map(({ icon: Icon, color, bg, data }, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className={`text-center p-7 rounded-2xl ${bg} hover:shadow-md transition-shadow`}>
                  <Icon className={`h-10 w-10 ${color} mx-auto mb-4`} />
                  <h4 className="font-bold text-gray-900 mb-2">{data.title}</h4>
                  <p className="text-sm text-gray-500">{data.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUSTED BY ─── */}
      <section className="py-14 bg-slate-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <AnimatedSection>
            <div className="text-center">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-10">
                {landing.trustedBy}
              </p>
              <div className="flex items-center justify-center gap-8 sm:gap-14 flex-wrap">
                {[1, 2, 3, 4, 5].map((n) => (
                  <div key={n} className={`relative w-16 h-16 sm:w-20 sm:h-20 ${n >= 4 ? 'hidden sm:block' : ''} ${n === 5 ? 'hidden md:block' : ''}`}>
                    <Image
                      src={`/assets/logos/union-${n}.png`}
                      alt="Union partner logo"
                      fill
                      className="object-contain opacity-60 hover:opacity-100 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="relative py-28 lg:py-40 overflow-hidden bg-[#0c1628]">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
        />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl -z-0" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <AnimatedSection>
            <div className="space-y-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-violet-500/20 rounded-2xl border border-violet-400/30 mb-2">
                <Users className="h-10 w-10 text-violet-400" />
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
                {landing.cta.title}
              </h2>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                {landing.cta.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className="h-16 px-12 text-lg bg-violet-500 hover:bg-violet-400 text-white font-bold shadow-2xl transition-all transform hover:scale-105 rounded-full"
                  >
                    {landing.cta.startFree}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button
                    size="lg"
                    className="h-16 px-12 text-lg bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 rounded-full transition-all"
                  >
                    {landing.cta.viewPricing}
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-slate-400 pt-2">
                {landing.cta.bottomText}
              </p>
              <div className="pt-6 border-t border-white/10">
                <p className="text-sm text-slate-400 mb-4">{landing.cta.demoText}</p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors text-sm font-medium"
                >
                  <Video className="h-4 w-4" />
                  {landing.cta.bookDemo}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-slate-950 text-slate-400 py-14">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="space-y-4">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-blue-400" />
                <span className="ml-2 text-lg font-bold text-white">UnionTab</span>
              </div>
              <p className="text-sm leading-relaxed">
                {landing.footer.description}
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-5">{landing.footer.product}</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/features" className="hover:text-white transition-colors">{landing.nav.features}</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">{landing.nav.pricing}</Link></li>
                <li><Link href="/blogs" className="hover:text-white transition-colors">{landing.nav.blog}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-5">{landing.footer.company}</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">{landing.footer.about}</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">{landing.nav.contact}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-5">{landing.footer.legal}</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">{landing.footer.privacy}</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">{landing.footer.terms}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-10 pt-8 text-center text-sm text-slate-600">
            <p>{landing.footer.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
