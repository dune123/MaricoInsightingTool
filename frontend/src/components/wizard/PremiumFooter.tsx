/**
 * ========================================
 * PREMIUM FOOTER COMPONENT
 * ========================================
 * 
 * Purpose: Sophisticated footer with additional information and premium design
 * 
 * Description:
 * This component creates a premium footer section that provides additional
 * information about the platform, contact details, and sophisticated design
 * elements to complete the home page experience.
 * 
 * Key Features:
 * - Premium design with sophisticated styling
 * - Platform information and features
 * - Contact and support details
 * - Premium visual elements and animations
 * - Professional branding elements
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Design Team
 */

import React from 'react';
import { 
  Sparkles, 
  Shield, 
  Zap, 
  Globe, 
  Mail, 
  Phone, 
  MapPin,
  ArrowUp,
  Heart
} from 'lucide-react';

export function PremiumFooter() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-gradient-to-br from-primary/5 via-white to-secondary/5 border-t border-border/40">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-secondary/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="mx-auto px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Platform Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-primary">Marico's</h3>
                  <p className="text-sm text-muted-foreground">Insighting Tool</p>
                </div>
              </div>
              
              <p className="text-muted-foreground leading-relaxed">
                Advanced analytics platform designed to transform data into actionable insights 
                for strategic decision making and business growth.
              </p>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Made with</span>
                <Heart className="w-4 h-4 text-destructive fill-current" />
                <span>by Marico Team</span>
              </div>
            </div>

            {/* Platform Features */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-primary">Platform Features</h4>
              <ul className="space-y-3">
                {[
                  'Advanced Statistical Modeling',
                  'Executive Dashboards',
                  'Real-time Analytics',
                  'Custom Workflows',
                  'Data Visualization',
                  'Predictive Insights'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors duration-300">
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technology Stack */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-primary">Technology</h4>
              <ul className="space-y-3">
                {[
                  'Python FastAPI Backend',
                  'React TypeScript Frontend',
                  'Machine Learning Models',
                  'Real-time Processing',
                  'Cloud Infrastructure',
                  'Advanced Security'
                ].map((tech, index) => (
                  <li key={index} className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors duration-300">
                    <div className="w-2 h-2 bg-secondary rounded-full flex-shrink-0" />
                    <span className="text-sm">{tech}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-primary">Get in Touch</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors duration-300">
                  <Mail className="w-4 h-4 text-primary" />
                  <span className="text-sm">support@marico.com</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors duration-300">
                  <Phone className="w-4 h-4 text-primary" />
                  <span className="text-sm">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors duration-300">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm">Global Operations</span>
                </div>
              </div>
              
              <div className="pt-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-premium rounded-full border border-border/40 shadow-sm">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Enterprise Security</span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border/40 my-12" />

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="w-4 h-4" />
                <span>English</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4" />
                <span>v2.1.0</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
                Privacy Policy
              </button>
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
                Terms of Service
              </button>
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300">
                Cookie Policy
              </button>
            </div>

            {/* Scroll to Top Button */}
            <button
              onClick={scrollToTop}
              className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
            >
              <ArrowUp className="w-5 h-5 text-white group-hover:-translate-y-1 transition-transform duration-300" />
            </button>
          </div>
        </div>

        {/* Bottom Badge */}
        <div className="border-t border-border/40 bg-background/50 backdrop-blur-sm">
          <div className="mx-auto px-8 py-6">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium text-muted-foreground">
                Powered by Marico's Insighting Tool
              </span>
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
