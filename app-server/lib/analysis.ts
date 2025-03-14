import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnalysisSchema } from '@/schemas';

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
