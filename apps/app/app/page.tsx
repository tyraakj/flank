"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Confidence } from "@/components/flank/confidence";
import { SupportStatus } from "@/components/flank/support-status";
import {
  Search,
  BarChart3,
  Target,
  Shield,
  Menu,
  ArrowRight,
  Zap,
  Globe,
  Lock,
  Sparkles,
  TrendingUp,
  Database,
  Cpu,
  Network,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    // Hero animations
    gsap.fromTo(
      heroRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" },
    );

    // Features scroll animation
    gsap.fromTo(
      featuresRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
        },
      },
    );

    // Staggered card animations
    if (cardsRef.current) {
      const cards = cardsRef.current.children;
      gsap.fromTo(
        cards,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 80%",
          },
        },
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  const floatingElements = [
    { icon: Target, color: "bg-blue-500/20", position: { top: "20%", left: "10%" }, delay: 0 },
    {
      icon: BarChart3,
      color: "bg-purple-500/20",
      position: { top: "30%", right: "15%" },
      delay: 0.2,
    },
    {
      icon: Shield,
      color: "bg-green-500/20",
      position: { bottom: "25%", left: "20%" },
      delay: 0.4,
    },
    {
      icon: TrendingUp,
      color: "bg-orange-500/20",
      position: { bottom: "35%", right: "10%" },
      delay: 0.6,
    },
    { icon: Database, color: "bg-pink-500/20", position: { top: "50%", left: "5%" }, delay: 0.8 },
    { icon: Cpu, color: "bg-cyan-500/20", position: { top: "60%", right: "8%" }, delay: 1 },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 overflow-hidden">
      {/* Animated Background with Mouse-following effect */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 bg-primary/5 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * 0.05,
            y: mousePosition.y * 0.05,
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-accent/5 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * -0.03,
            y: mousePosition.y * -0.03,
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Floating Elements in Hero */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {floatingElements.map((element, index) => (
          <motion.div
            key={index}
            className={`absolute ${element.color} rounded-2xl p-4 backdrop-blur-sm border border-white/10`}
            style={element.position}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 6 + index * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: element.delay,
            }}
          >
            <element.icon className="h-8 w-8 text-foreground/70" />
          </motion.div>
        ))}
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="border-b bg-background/80 backdrop-blur-lg sticky top-0 z-50"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="h-8 w-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center shadow-lg">
                <Target className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Flank
              </span>
            </motion.div>

            <div className="hidden md:flex items-center gap-6">
              {["Features", "Demo", "About"].map((item) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group"
                  whileHover={{ y: -2 }}
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                </motion.a>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="sm" className="hidden md:inline-flex">
                  Sign In
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="sm" disabled className="relative overflow-hidden">
                  <span className="relative z-10">Get Started</span>
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.5 }}
                  />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section ref={heroRef} className="container mx-auto px-4 py-32 relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Badge className="mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Competitive Intelligence Platform
            </Badge>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            One input: your product's URL
          </motion.h1>

          <motion.p
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Get a live, fully cited competitive analysis report with pricing, positioning, feature
            matrix, and concrete edge recommendations.
          </motion.p>

          {/* URL Input Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="border-2 border-primary/20 shadow-2xl bg-background/80 backdrop-blur-lg">
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <motion.div className="flex-1" whileFocus={{ scale: 1.02 }}>
                    <Input
                      placeholder="https://your-product.com"
                      className="flex-1 border-primary/30 focus:border-primary"
                      disabled
                    />
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button disabled className="bg-gradient-to-r from-primary to-primary/80">
                      <Search className="h-4 w-4 mr-2" />
                      Analyze
                    </Button>
                  </motion.div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  URL submission coming soon (Unit 21)
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Animated Stats */}
          <motion.div
            className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            {[
              { icon: Globe, label: "Real-time", value: "Competitors" },
              { icon: Shield, label: "100%", value: "Cited" },
              { icon: Zap, label: "AI-Powered", value: "Analysis" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2 + index * 0.1 }}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                </motion.div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} id="features" className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="text-4xl font-bold text-center mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            What You'll Get
          </motion.h2>
          <motion.p
            className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Automated competitive intelligence that saves you weeks of manual research
          </motion.p>

          <div ref={cardsRef} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Target,
                title: "Competitor Discovery",
                desc: "Automatic multi-angle web search to find your real competitors",
              },
              {
                icon: BarChart3,
                title: "Pricing Matrix",
                desc: "Side-by-side pricing comparison with plans, tiers, and limits",
              },
              {
                icon: Shield,
                title: "Full Evidence",
                desc: "Every fact links to its source page with excerpts and snapshots",
              },
              {
                icon: Search,
                title: "Edge Opportunities",
                desc: "Ranked strategic recommendations with evidence and impact scores",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -8, transition: { type: "spring", stiffness: 300 } }}
              >
                <Card className="h-full border-2 border-transparent hover:border-primary/20 transition-all shadow-lg hover:shadow-xl bg-gradient-to-br from-background to-muted/30">
                  <CardHeader>
                    <motion.div
                      className="h-12 w-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center mb-2"
                      whileHover={{ rotate: 360, transition: { duration: 0.6 } }}
                    >
                      <feature.icon className="h-6 w-6 text-primary" />
                    </motion.div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">{feature.desc}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Design System Demo Section */}
      <section
        id="demo"
        className="container mx-auto px-4 py-24 bg-gradient-to-b from-muted/50 to-background"
      >
        <div className="max-w-4xl mx-auto">
          <motion.h2
            className="text-4xl font-bold text-center mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Design System Preview
          </motion.h2>
          <motion.p
            className="text-muted-foreground text-center mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Premium components built with custom Tailwind and CSS variables
          </motion.p>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Card className="border-2 border-primary/20 shadow-2xl bg-background/80 backdrop-blur-lg">
              <CardHeader>
                <CardTitle>Component Examples</CardTitle>
                <CardDescription>
                  Demonstrating the custom UI components and design tokens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Confidence Levels */}
                <motion.div variants={itemVariants}>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Confidence Levels
                  </h3>
                  <div className="flex gap-4 flex-wrap">
                    {[
                      { score: 95, label: "High" },
                      { score: 75, label: "Normal" },
                      { score: 55, label: "Low", reason: "Limited sources" },
                      { score: 25, label: "Insufficient", reason: "No credible data" },
                    ].map((conf, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <Confidence score={conf.score} reason={conf.reason} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Support Status */}
                <motion.div variants={itemVariants}>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Support Status
                  </h3>
                  <div className="flex gap-4 flex-wrap">
                    {["yes", "partial", "no", "unknown"].map((status, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <SupportStatus status={status as any} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Buttons */}
                <motion.div variants={itemVariants}>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Button Variants
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {["default", "destructive", "outline", "secondary", "ghost", "link"].map(
                      (variant, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button variant={variant as any}>{variant}</Button>
                        </motion.div>
                      ),
                    )}
                  </div>
                </motion.div>

                {/* Badges */}
                <motion.div variants={itemVariants}>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Badges
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {["default", "secondary", "destructive", "outline"].map((variant, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <Badge variant={variant as any}>{variant}</Badge>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            className="text-4xl font-bold text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            About Flank
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="border-2 border-primary/20 shadow-2xl bg-gradient-to-br from-background to-muted/30">
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4 text-lg">
                  Flank is a competitive intelligence platform that helps you understand your market
                  landscape. Simply paste your product's URL and get a comprehensive analysis of
                  your competitors, their pricing, positioning, and features—all with full source
                  citations.
                </p>
                <p className="text-muted-foreground mb-6 text-lg">
                  Built with modern technologies including Next.js, TypeScript, and a custom design
                  system, Flank provides actionable insights to help you find your edge in the
                  market.
                </p>
                <div className="flex gap-4 flex-wrap">
                  {[
                    "Next.js 16",
                    "TypeScript",
                    "Tailwind CSS",
                    "Custom UI",
                    "GSAP",
                    "Framer Motion",
                  ].map((tech, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.05, rotate: 2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Badge
                        variant={index % 2 === 0 ? "default" : "secondary"}
                        className="text-sm"
                      >
                        {tech}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="border-2 border-primary/30 shadow-2xl bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-lg">
            <CardContent className="pt-12 pb-12">
              <h2 className="text-3xl font-bold mb-4">Ready to find your competitive edge?</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Get started with Flank and discover what your competitors are doing, how they
                position themselves, and what opportunities you're missing.
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  disabled
                  className="bg-gradient-to-r from-primary to-primary/80 text-lg px-8"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
              <p className="text-sm text-muted-foreground mt-4">
                Coming soon — URL submission in Unit 21
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-12 border-t">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            className="flex items-center justify-center gap-2 mb-4"
            whileHover={{ scale: 1.05 }}
          >
            <div className="h-8 w-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Flank</span>
          </motion.div>
          <p className="text-sm text-muted-foreground mb-2">Competitive Intelligence Platform</p>
          <p className="text-xs text-muted-foreground">
            Built with Next.js, TypeScript, GSAP, and Framer Motion
          </p>
        </div>
      </footer>
    </main>
  );
}
