'use client';

import { PulseLoader } from 'react-spinners';

/**
 * Renders a loading screen for the analysis pages. This screen is needed as analysis can take a while to load.
 *
 * @param {Boolean} isLoading - Whether the data is still loading
 * @returns {React.ReactNode} - The rendered loading screen component
 */
export function AnalysisLoadingScreen({ isLoading }: { isLoading: Boolean }): React.ReactNode {
  if (!isLoading)
    return null; // don't show loading screen if data is already loaded
  else
    return (
      <div className="flex flex-col items-center justify-center flex-grow py-5 text-gray-700">
        <h2 className="text-xl font-semibold mb-10">Daten werden geladen...</h2>
        <PulseLoader color="#999" size={20} />
        <h3 className="text-md text-gray-600 mt-10 text-center max-w-lg">
          Basierend auf der Abfragedefinition kann dies eine Weile dauern. <br /> Bitte warten...
        </h3>
      </div>
    );
}
