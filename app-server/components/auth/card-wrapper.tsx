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

/**
 * Props used by the CardWrapper component to display a card with a title, description, content, and optional footer link.
 */
interface CardWrapperProps {
  children: React.ReactNode;
  cardTitle: string;
  cardDescription?: string;
  footerLinkLabel?: string;
  footerLinkHref?: string;
}

/**
 * Renders a CardWrapper component to display a card with a title, description, content, and optional footer link (used for auth pages).
 *
 * @param {CardWrapperProps} props - The props used by the CardWrapper component containing the card title, description, content, and optional footer link
 * @returns {JSX.Element} - The rendered CardWrapper component
 */
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
