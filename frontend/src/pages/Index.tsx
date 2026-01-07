import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  Search,
  Menu,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/amac-logo.png"
              alt="AMAC Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold text-gray-800">AMAC</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Header Section */}
      <header className="bg-[#006838] text-white py-6 px-4 shadow-lg">
        <div className="max-w-md mx-auto text-center">
          {/* AMAC Logo */}
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-lg p-2">
              <img
                src="/amac-logo.png"
                alt="AMAC Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-lg font-bold mb-2 leading-tight">
            AMAC REVENUE<br/>COLLECTION PORTAL
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-green-100">
            Pay Your Taxes, Build Your City
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pb-8">
        <div className="max-w-md mx-auto -mt-4">
          {/* Info Box */}
          <div className="bg-white rounded-t-2xl shadow-lg p-6 mb-6">
            <p className="text-sm text-gray-700 leading-relaxed text-center">
              Abuja Municipal Area Council - Promoting Internally Generated Revenue (IGR)
              for sustainable development and improved municipal services.
            </p>
          </div>

          {/* Main Action Question */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 text-center mb-6">
              HOW DO YOU WANT TO PROCEED?
            </h2>

            <div className="space-y-4">
              {/* Path 1: Pay Existing Demand Notice */}
              <Link
                to="/pay-demand-notice"
                className="w-full bg-[#006838] text-white p-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-between group hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-base mb-1">I HAVE A DEMAND NOTICE</div>
                    <div className="text-sm text-green-100">
                      Pay existing bill sent by AMAC
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 opacity-70 group-hover:opacity-100 transition-opacity" />
              </Link>

              {/* Path 2: Apply for Assessment */}
              <Link
                to="/apply-assessment"
                className="w-full bg-[#1f2937] text-white p-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-between group hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <PlusCircle className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-base mb-1">I NEED AN ASSESSMENT</div>
                    <div className="text-sm text-gray-300">
                      Apply for new assessment of property/business
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 opacity-70 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>

          {/* Additional Actions */}
          <div className="space-y-3">
            {/* Verify Receipt */}
            <Link
              to="/verify-receipt"
              className="w-full bg-white border border-gray-300 p-4 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-between group hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800 text-sm">VERIFY A RECEIPT</div>
                  <div className="text-xs text-gray-600">Check if a receipt is genuine</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </Link>

            {/* Search Services */}
            <Link
              to="/services"
              className="w-full bg-white border border-gray-300 p-4 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-between group hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Search className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-gray-800 text-sm">BROWSE ALL SERVICES</div>
                  <div className="text-xs text-gray-600">Find revenue types & requirements</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </Link>
          </div>

          {/* Footer Info */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 mb-2">
              Need help? Contact AMAC Revenue Department
            </p>
            <p className="text-xs text-gray-400">
              © 2026 Abuja Municipal Area Council
            </p>
          </div>

          {/* Bottom spacing for mobile */}
          <div className="h-6"></div>
        </div>
      </main>
    </div>
  );
};

export default Index;
