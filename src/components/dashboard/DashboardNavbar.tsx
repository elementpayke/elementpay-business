"use client";

import { Search, Bell, Settings, ChevronDown } from "lucide-react";

export default function DashboardNavbar() {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      {/* Left: Logo */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
            <span className="text-white dark:text-black font-bold text-sm">E</span>
          </div>
          <span className="font-bold text-lg tracking-tight">ElementPay</span>
        </div>

        {/* Greeting */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Hello <span className="font-semibold text-gray-900 dark:text-white">John</span>{" "}
          <span>👋</span>{" "}
          <span className="text-gray-400 dark:text-gray-500">Welcome back</span>
        </div>
      </div>

      {/* Right: Search + actions */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm w-48 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative">
          <Bell className="w-5 h-5 text-gray-500" />
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Settings className="w-5 h-5 text-gray-500" />
        </button>
        <button className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
            <span className="text-white text-xs font-semibold">JD</span>
          </div>
          <span className="text-sm font-medium">John Doe</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </header>
  );
}
