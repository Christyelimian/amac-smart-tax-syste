import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, ArrowLeft } from 'lucide-react';
import Footer from "@/components/ui/Footer";
import HeroSection from "@/components/home/HeroSection";
import PopularServices from "@/components/home/PopularServices";
import WhyPayWithUs from "@/components/home/WhyPayWithUs";
import QuickActions from "@/components/home/QuickActions";
import Testimonials from "@/components/home/Testimonials";
import SupportCTA from "@/components/home/SupportCTA";

const Portal = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Traditional Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm">Back to App</span>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex items-center gap-3">
              <img
                src="/amac-logo.png"
                alt="AMAC Logo"
                className="w-8 h-8 object-contain"
              />
              <span className="font-bold text-gray-800">AMAC Revenue Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              My Dashboard
            </Link>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <HeroSection />
        <PopularServices />
        <WhyPayWithUs />
        <QuickActions />
        <Testimonials />
        <SupportCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Portal;
