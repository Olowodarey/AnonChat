"use client";

import Link from "next/link";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-15 bg-gradient-to-b from-primary to-transparent" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-15 bg-gradient-to-t from-accent to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* 404 Number with Glow Effect */}
        <div className="relative mb-8">
          <h1 className="text-[150px] sm:text-[200px] lg:text-[250px] font-bold leading-none">
            <span className="gradient-text">404</span>
          </h1>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 mb-8">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">Page Not Found</span>
        </div>

        {/* Main Message */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
          <span className="gradient-text">Oops!</span> This Page Went{" "}
          <span className="gradient-text">Anonymous</span>
        </h2>

        {/* Description */}
        <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
          Looks like this page is hiding better than our encrypted messages. The
          page you're looking for doesn't exist or has been moved to a more
          secure location.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-border/50 rounded-lg hover:bg-card/50 transition-all duration-300 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>

        {/* Helpful Links in Card */}
        <div className="glow-box rounded-2xl p-8 max-w-2xl mx-auto mb-5">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Search className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-bold">Looking for something?</h3>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 ">
            <Link
              href="/#features"
              className="p-4 rounded-lg border border-border/50 hover:bg-card/50 transition-all duration-300 hover:border-primary/50 group"
            >
              <p className="font-semibold mb-1 group-hover:text-primary transition-colors">
                Features
              </p>
              <p className="text-sm text-muted-foreground">
                Explore our features
              </p>
            </Link>

            <Link
              href="/#security"
              className="p-4 rounded-lg border border-border/50 hover:bg-card/50 transition-all duration-300 hover:border-primary/50 group"
            >
              <p className="font-semibold mb-1 group-hover:text-primary transition-colors">
                Security
              </p>
              <p className="text-sm text-muted-foreground">
                Learn about safety
              </p>
            </Link>

            <Link
              href="/#community"
              className="p-4 rounded-lg border border-border/50 hover:bg-card/50 transition-all duration-300 hover:border-primary/50 group"
            >
              <p className="font-semibold mb-1 group-hover:text-primary transition-colors">
                Community
              </p>
              <p className="text-sm text-muted-foreground">Join the network</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
