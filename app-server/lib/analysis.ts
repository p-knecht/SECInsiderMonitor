import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnalysisSchema } from '@/schemas';

/**
 * Auxiliary function to parse and handle analysis queries in a generic way for company and network analysis. (prevents code duplication)
 *
 * @param {(params: any) => Promise<T>} analysisFunction - The function to fetch the analysis data from the server
 * @param {(params: any) => string| null} validateParams - A custom validation function to check if the search params are valid for the specific analysis type
 * @returns {<T>, string, boolean} - The fetched data, an error message if an error occurred, and a boolean indicating if the data is currently being fetched
 */
export function parseAndHandleAnalysisQuery<T>(
  analysisFunction: (params: any) => Promise<T>,
  validateParams: (params: any) => string | null,
) {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | undefined>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<T | undefined>();

  useEffect(() => {
    setErrorMessage('');
    setData(undefined);

    if (searchParams.size === 0) return; // no further action if no search params are present --> only show filter dialog

    // verify if search params are valid (generic zod check)
    const verifiedSearchParams = AnalysisSchema.safeParse(
      Object.fromEntries(searchParams.entries()),
    );
    if (!verifiedSearchParams.success) {
      // if search params are invalid (generic zod check), show error message
      setErrorMessage(
        `Ungültige Suchparameter. Detaillierte Fehlerbeschreibung: ${verifiedSearchParams.error.message}`,
      );
    } else {
      const validationError = validateParams(verifiedSearchParams.data); // run custom validation (different for analysis types --> therefore passed as parameter)
      if (validationError) {
        // if search params are invalid (custom validation), show error message
        setErrorMessage(validationError);
      } else {
        // if param checks (generic and custom) are successful, fetch data
        setIsLoading(true);
        /**
         * Fetches the analysis data from the server and sets the data or error message accordingly.
         *
         * @returns {Promise<void>} - a promise that resolves when the data is fetched
         */
        async function fetchData() {
          try {
            const responseData = await analysisFunction(verifiedSearchParams.data);
            if ((responseData as any).error)
              setErrorMessage((responseData as any).error); // propagate error message from server
            else setData(responseData); // set data if no error occurred
          } catch (error) {
            setErrorMessage(`Fehler beim Abrufen der Daten: ${error}`);
          } finally {
            setIsLoading(false);
          }
        }
        fetchData();
      }
    }
  }, [searchParams]);

  return { data, errorMessage, isLoading };
}
