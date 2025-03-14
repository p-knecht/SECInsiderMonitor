'use client';

import { PulseLoader } from 'react-spinners';

export function AnalysisLoadingScreen({ isLoading }: { isLoading: Boolean }): React.ReactNode {
  if (!isLoading) return null;
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
