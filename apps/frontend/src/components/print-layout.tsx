'use client';

import React from 'react';

interface PrintLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function PrintLayout({ children, title }: PrintLayoutProps) {
  return (
    <>
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          .print-hide {
            display: none !important;
          }
          .print-layout {
            background: white;
            color: black;
            padding: 2rem;
            margin: 0;
          }
          .page-break {
            page-break-after: always;
          }
        }
      `}</style>

      <div className="print-layout">
        {title && (
          <div className="mb-6 print:mb-4">
            <h1 className="text-3xl font-bold print:text-2xl">{title}</h1>
          </div>
        )}
        {children}
      </div>
    </>
  );
}
