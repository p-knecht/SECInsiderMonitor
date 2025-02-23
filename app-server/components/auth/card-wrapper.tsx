'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CardWrapperProps {
  children: React.ReactNode;
  cardTitle: string;
  cardDescription?: string;
  footerLinkLabel?: string;
  footerLinkHref?: string;
}

export const CardWrapper = ({
  children,
  cardTitle: cardTitle,
  cardDescription: cardDescription,
  footerLinkLabel: footerLinkLabel,
  footerLinkHref: footerLinkHref,
}: CardWrapperProps) => {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">{cardTitle}</CardTitle>
        {cardDescription && <CardDescription>{cardDescription}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footerLinkLabel && footerLinkHref && (
        <CardFooter className="justify-center">
          <Button variant="link" asChild className="hover-hover:underline">
            <Link href={footerLinkHref}>{footerLinkLabel}</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
