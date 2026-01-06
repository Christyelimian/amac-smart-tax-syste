import React from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Gavel,
  Banknote,
  Phone,
  Mail,
  Info,
  HelpCircle,
  Menu,
  ChevronRight
} from 'lucide-react';

const Index = () => {
  const menuItems = [
    {
      title: "AMAC REVENUE",
      path: "/revenue",
      icon: DollarSign,
      color: "bg-[#2d5016] hover:bg-[#1a2d0d]",
      textColor: "text-white"
    },
    {
      title: "AMAC AUCTION",
      path: "/auction",
      icon: Gavel,
      color: "bg-[#2d5016] hover:bg-[#1a2d0d]",
      textColor: "text-white"
    },
    {
      title: "AMAC MICROFINANCE",
      path: "/microfinance",
      icon: Banknote,
      color: "bg-[#2d5016] hover:bg-[#1a2d0d]",
      textColor: "text-white"
    },
    {
      title: "EMERGENCY LINES",
      path: "/emergency",
      icon: Phone,
      color: "bg-[#4a2c2a] hover:bg-[#2d1a19]",
      textColor: "text-white"
    },
    {
      title: "CONTACT US",
      path: "/contact",
      icon: Mail,
      color: "bg-[#0284c7] hover:bg-[#0369a1]",
      textColor: "text-white"
    },
    {
      title: "ABOUT US",
      path: "/about",
      icon: Info,
      color: "bg-[#1f2937] hover:bg-[#111827]",
      textColor: "text-white"
    },
    {
      title: "SUPPORTS",
      path: "/support",
      icon: HelpCircle,
      color: "bg-white hover:bg-gray-50 border border-gray-300",
      textColor: "text-gray-800"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Traditional Header */}
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

      {/* Mobile App Header Section */}
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
            AMAC REVENUE<br/>MOBILE APP
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-green-100">
            (c) 2023 - Abuja Municipal Area Council
          </p>
        </div>
      </header>

      {/* Content Section */}
      <main className="flex-1 px-4 pb-8">
        <div className="max-w-md mx-auto -mt-4">
          {/* Info Box */}
          <div className="bg-white rounded-t-2xl shadow-lg p-4 mb-6">
            <p className="text-sm text-gray-700 leading-relaxed">
              Municipal Area Council to promote the Internally Generated Revenue (IGR) of the Council.... AM
            </p>
          </div>

          {/* Menu Buttons */}
          <div className="space-y-3">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className={`${item.color} ${item.textColor} w-full p-4 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-between group hover:scale-[1.02] active:scale-[0.98]`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm uppercase tracking-wide">
                    {item.title}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>

          {/* Bottom spacing for mobile */}
          <div className="h-6"></div>
        </div>
      </main>
    </div>
  );
};

export default Index;
