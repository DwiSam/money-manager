"use client";

import React, { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
  className = "",
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={`bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 hover:bg-neutral-800/30 transition-colors group"
      >
        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors text-left">
          {title}
        </h3>
        <div
          className={`p-2 rounded-full bg-neutral-800/50 text-neutral-400 group-hover:text-white group-hover:bg-neutral-700 transition-all duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </button>

      {/* Content */}
      <div
        className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-6 pt-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
