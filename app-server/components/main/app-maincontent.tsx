'use client';

import React from 'react';
import { AppHeader } from '@/components/main/app-header';

/**
 * Defines the properties for the AppMainContent component containing the children and path components.
 */
interface AppMainContentProps {
  children: React.ReactNode;
  pathComponents?: { title: string; path?: string }[];
}

/**
 * Renders the AppMainContent component wrapping the childern and adding the provided path components as breadcrumbs in header.
 *
 * @param {AppMainContentProps} { children, pathComponents } - The AppMainContent properties containing the children and path components.
 * @returns {JSX.Element} - The renderer AppMainContent component.
 */
export function AppMainContent({ children, pathComponents }: AppMainContentProps) {
  return (
    <>
      <AppHeader pathComponents={pathComponents} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
    </>
  );
}
