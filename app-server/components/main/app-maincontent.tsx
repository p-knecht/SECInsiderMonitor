'use client';

import React from 'react';
import { AppHeader } from '@/components/main/app-header';

interface AppMainContentProps {
  children: React.ReactNode;
  pathComponents?: { title: string; path: string }[];
}

export function AppMainContent({ children, pathComponents }: AppMainContentProps) {
  return (
    <>
      <AppHeader pathComponents={pathComponents} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
    </>
  );
}
