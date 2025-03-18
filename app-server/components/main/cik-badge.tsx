import { ReactNode, useEffect, useState } from 'react';
import { lookupCik } from '@/actions/main/filings/loopkup-cik';
import { CikObject } from '@/data/cik';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// use cache to store queried CIK data for faster badge rendering
const cikCache = new Map<string, CikObject>();

/**
 * Calculates the badge style based on the CIK.
 *
 * @param {string} cik - The CIK to calculate the badge style for.
 * @returns {Record<string, string>} - The badge style object containing the background color and text color.
 */
export const calculateCikBadgeStyle = (cik: string) => {
  let hash = 0;
  // calculate a numeric hash from the CIK (no secure hashing needed here, as we only need it for consistent and fast color deviation; based on https://stackoverflow.com/a/7616484)
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

/**
 * Renders a custom badge component for a given CIK, including the CIK name and ticker symbol. If the CIK name is not provided, it will be looked up and cached.
 *
 * @param {string} cik - The CIK to render the badge for.
 * @param {string} cikName - The CIK name to render the badge for. If not provided, the CIK name will be looked up.
 * @param {string} cikTicker - The CIK ticker symbol to render the badge for. If not provided, the CIK ticker symbol will be looked up.
 * @param {'left' | 'right' | 'top' | 'bottom'} tooltipLocation - The location of the tooltip. Defaults to 'right'.
 * @param {ReactNode} children - The children to render inside the badge, to extend the badge with additional content.
 * @returns {React.ReactNode} - The rendered CIK badge component.
 */
export const CikBadge = ({
  cik,
  cikName,
  cikTicker,
  tooltipLocation,
  children,
}: {
  cik: string;
  cikName?: string;
  cikTicker?: string;
  tooltipLocation?: 'left' | 'right' | 'top' | 'bottom';
  children?: ReactNode;
}): React.ReactNode => {
  const [fullCikObject, setFullCikObject] = useState<CikObject | null>(
    cikName ? { cik, cikName, cikTicker } : cikCache.get(cik) || null, // only set the full object if the name is already known --> if so we don't need to look it up
  );

  useEffect(() => {
    if (!cikName) {
      // if the full object is not set yet (no cikName provided), look it up
      if (cikCache.has(cik)) {
        setFullCikObject(cikCache.get(cik)!); // if the cache has the data, use it
      } else {
        // if the cache does not have the data, look it up
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

  // calculate badge style based on the CIK
  const { backgroundColor, textColor } = calculateCikBadgeStyle(cik);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge style={{ backgroundColor, color: textColor }}>
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
      <TooltipContent side={tooltipLocation || 'right'}>
        CIK: <span className="font-semibold">{cik}</span>
      </TooltipContent>
    </Tooltip>
  );
};
