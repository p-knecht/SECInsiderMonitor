'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import React from 'react';

/**
 * Renders the AppHeader component with the provided path components as breadcrumbs.
 * @param {pathComponents: { title: string; path?: string }[]} - The AppHeader properties containing the path components to be displayed.
 * @returns {JSX.Element} - The renderer AppHeader component.
 */
export function AppHeader({
  pathComponents = [],
}: {
  pathComponents?: { title: string; path?: string }[];
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4 h-4">
        {' '}
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem
              className={pathComponents.length > 0 ? 'hidden md:block' : undefined}
              key="base"
            >
              SECInsiderMonitor
            </BreadcrumbItem>
            {pathComponents.length > 0 && (
              <BreadcrumbSeparator className="hidden md:block" key="base-sep" />
            )}
            {pathComponents.map((component, index) => (
              <React.Fragment key={`component-fragment-${index}`}>
                <BreadcrumbItem
                  key={`component-${index}`}
                  className={index !== pathComponents.length - 1 ? 'hidden md:block' : undefined}
                >
                  {component.path ? (
                    <BreadcrumbLink asChild>
                      <Link href={component.path}>{component.title}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <span>{component.title}</span>
                  )}
                </BreadcrumbItem>
                {index < pathComponents.length - 1 && (
                  <BreadcrumbSeparator
                    key={`component-${index}-sep`}
                    className={index !== pathComponents.length - 1 ? 'hidden md:block' : undefined}
                  />
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
