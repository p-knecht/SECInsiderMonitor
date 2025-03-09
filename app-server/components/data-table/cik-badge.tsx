import { ReactNode, useEffect, useState } from 'react';
import { lookupCik } from '@/actions/main/filings/loopkup-cik';
import { CikObject } from '@/data/cik';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// use cache to store queried CIK data for faster badge rendering
const cikCache = new Map<string, CikObject>();

export const calculateCikBadgeStyle = (cik: string) => {
  let hash = 0;
  // calculate a numeric hash from the CIK (no secure hashing needed here, as we only need it for consistent and fast (!) color deviation; based on https://stackoverflow.com/a/7616484)
  for (let i = 0; i < cik.length; i++) {
    hash = (hash << 5) - hash + cik.charCodeAt(i);
    hash |= 0;
  }

  // calculate hue, saturation and value based on the hash
  const hue = Math.abs(hash) % 360;
  const saturation = 60 + (Math.abs(hash) % 30);
  const value = 25 + (Math.abs(hash) % 50);

  return {
    backgroundColor: `hsl(${hue}, ${saturation}%, ${value}%)`,
    textColor: value > 55 ? '#000000' : '#FFFFFF', // if value is too high, text color should be black to ensure readability
  };
};

export const CikBadge = ({
  cik,
  cikName,
  cikTicker,
  children,
}: {
  cik: string;
  cikName?: string;
  cikTicker?: string;
  children?: ReactNode;
}): React.ReactNode => {
  const [fullCikObject, setFullCikObject] = useState<CikObject | null>(
    cikName ? { cik, cikName, cikTicker } : cikCache.get(cik) || null, // only set the full object if the name is already known --> if so we don't need to look it up
  );

  useEffect(() => {
    if (!cikName) {
      // if the full object is not set yet (no cikName provided), look it up
      if (cikCache.has(cik)) {
        setFullCikObject(cikCache.get(cik)!);
      } else {
        lookupCik({ cik }).then((data) => {
          if (data?.cikName) {
            // only save data to cache if we get a valid response
            cikCache.set(cik, {
              cik,
              cikName: data.cikName,
              cikTicker: data.cikTicker || undefined,
            });
          }
          setFullCikObject({
            cik,
            cikName: data?.cikName || cik, // if no name is found, use the cik as name to avoid empty badges
            cikTicker: data?.cikTicker || undefined,
          });
        });
      }
    } else {
      if (cikName)
        // if the full object is received, cache it
        cikCache.set(cik, { cik, cikName, cikTicker });
      setFullCikObject({ cik, cikName, cikTicker });
    }
  }, [cik]);

  const { backgroundColor, textColor } = calculateCikBadgeStyle(cik);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge style={{ backgroundColor, color: textColor }} className="whitespace-pre-wrap">
          {fullCikObject ? (
            fullCikObject.cikTicker ? (
              <>
                <span className="font-semibold">{fullCikObject.cikTicker}</span> (
                {fullCikObject.cikName})
              </>
            ) : (
              fullCikObject.cikName
            )
          ) : (
            'Daten werden geladen...'
          )}
          {children}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="right">
        CIK: <span className="font-semibold">{cik}</span>
      </TooltipContent>
    </Tooltip>
  );
};
