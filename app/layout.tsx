import React from 'react';
import { Toaster } from '@lib/components/ui/sonner';
import "../styles/global.css"
export default function layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`font-sans  `}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
