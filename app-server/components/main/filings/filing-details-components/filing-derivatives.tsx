'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { OwnershipFiling } from '@prisma/client';
import { buildFieldContent } from '@/components/main/filings/filing-details-components/filing-table-content';

/**
 * Renders a component that displays the derivative instruments (transactions and holdings) of the filing.
 * @param {OwnershipFiling} filingData - The filing data to display the derivative instruments for
 * @returns {JSX.Element} - The component that displays the derivative instruments (transactions and holdings) of the filing
 */
export default function FilingDerivatives({ filingData }: { filingData: OwnershipFiling }) {
  if (
    // check if there is no data (holdings or transactions) for non-derivative instruments
    !filingData.formData?.derivativeTable ||
    ((!filingData.formData?.derivativeTable.derivativeHolding ||
      filingData.formData?.derivativeTable.derivativeHolding.length === 0) &&
      (!filingData.formData?.derivativeTable.derivativeTransaction ||
        filingData.formData?.derivativeTable.derivativeTransaction.length === 0))
  ) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-gray-500 text-center">
          Keine Informationen zu derivativen Instrumenten vorhanden.
        </p>
      </div>
    );
  }

  // add shortcuts for holdings, transactions and footnotes
  const holdings = filingData.formData?.derivativeTable?.derivativeHolding || [];
  const transactions = filingData.formData?.derivativeTable?.derivativeTransaction || [];
  const footnotes = filingData.formData?.footnotes?.footnote || [];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {(filingData.formType == '4' || filingData.formType == '5') && transactions.length > 0 && (
          <div>
            <h2 className="text-md font-medium text-gray-800 text-center mb-2">
              Non-Derivative Transactions
            </h2>
            <div className="overflow-x-auto rounded-md">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-100 text-gray-700 uppercase p-1">
                  <tr>
                    <th className="border p-1 text-center">Title of Security</th>
                    <th className="border p-1 text-center">Conversion/Exercise Price</th>
                    <th className="border p-1 text-center">Transaction Date</th>
                    <th className="border p-1 text-center">Deemed Execution Date</th>
                    <th className="border p-1 text-center">Transaction Coding</th>
                    <th className="border p-1 text-center">Transaction Timeliness</th>
                    <th className="border p-1 text-center">Transaction Amounts</th>
                    <th className="border p-1 text-center">Exercise Date</th>
                    <th className="border p-1 text-center">Expiration Date</th>
                    <th className="border p-1 text-center">Underlying Security</th>
                    <th className="border p-1 text-center">Post Transaction Amounts</th>
                    <th className="border p-1 text-center">Ownership</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction, index) => (
                    <tr key={index} className="border-b bg-gray-50">
                      <td className="border p-1 text-center">
                        {buildFieldContent(transaction.securityTitle, footnotes)}
                      </td>
                      <td className="border p-1 text-center">
                        {buildFieldContent('USD', footnotes)}{' '}
                        {buildFieldContent(transaction.conversionOrExercisePrice, footnotes)}
                      </td>
                      <td className="border p-1 text-center">
                        {buildFieldContent(transaction.transactionDate, footnotes)}
                      </td>
                      <td className="border p-1 text-center">
                        {buildFieldContent(transaction.deemedExecutionDate, footnotes)}
                      </td>
                      <td className="border p-1 text-center">
                        {buildFieldContent(
                          transaction.transactionCoding,
                          footnotes,
                          'transactionCoding',
                        )}
                      </td>
                      <td className="border p-1 text-center">
                        {buildFieldContent(
                          transaction.transactionTimeliness
                            ? transaction.transactionTimeliness
                            : { value: '-' }, // if transactionTimeliness is empty, set it to '-' to add explaining tooltip
                          footnotes,
                          'transactionTimeliness',
                        )}
                      </td>
                      <td className="border p-1 text-center">
                        {buildFieldContent(
                          transaction.transactionAmounts,
                          footnotes,
                          'transactionAmounts',
                        )}
                      </td>
                      <td className="border p-1 text-center">
                        {buildFieldContent(transaction.exerciseDate, footnotes)}
                      </td>
                      <td className="border p-1 text-center">
                        {buildFieldContent(transaction.expirationDate, footnotes)}
                      </td>
                      <td className="border p-1 text-center">
                        {buildFieldContent(
                          transaction.underlyingSecurity,
                          footnotes,
                          'underlyingSecurity',
                        )}
                      </td>
                      <td className="border p-1 text-center">
                        {buildFieldContent(
                          transaction.postTransactionAmounts,
                          footnotes,
                          'postTransactionAmounts',
                        )}
                      </td>
                      <td className="border p-1 text-center">
                        {buildFieldContent(
                          transaction.ownershipNature,
                          footnotes,
                          'ownershipNature',
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {holdings.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-800 text-center mb-2">
              Non-Derivative Holdings
            </h2>
            <div className="overflow-x-auto rounded-md">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-100 text-gray-700 uppercase p-1">
                  <tr>
                    <th className="border p-1 text-center">Title of Security</th>
                    <th className="border p-1 text-center">Conversion/Exercise Price</th>
                    {filingData.formType == '5' && (
                      <th className="border p-1 text-center">Transaction Coding</th>
                    )}
                    <th className="border p-1 text-center">Exercise Date</th>
                    <th className="border p-1 text-center">Expiration Date</th>
                    <th className="border p-1 text-center">Underlying Security</th>
                    <th className="border p-1 text-center">Holding Amounts</th>
                    <th className="border p-1 text-center">Ownership</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding, index) => (
                    <tr key={index} className="border-b bg-gray-50">
                      <td className="border p-1 text-center">
                        {buildFieldContent(holding.securityTitle, footnotes)}
                      </td>
                      <td className="border p-1 text-center">
                        {buildFieldContent('USD', footnotes)}{' '}
                        {buildFieldContent(holding.conversionOrExercisePrice, footnotes)}
                      </td>
                      {filingData.formType == '5' && (
                        <td className="border p-1 text-center">
                          {buildFieldContent(
                            holding.transactionCoding,
                            footnotes,
                            'transactionCoding',
                          )}
                        </td>
                      )}
                      <td className="border p-1 text-center">
                        {buildFieldContent(holding.exerciseDate, footnotes)}
                      </td>
                      <td className="border p-1 text-center">
                        {buildFieldContent(holding.expirationDate, footnotes)}
                      </td>
                      <td className="border p-1 text-center">
                        {buildFieldContent(
                          holding.underlyingSecurity,
                          footnotes,
                          'underlyingSecurity',
                        )}
                      </td>
                      <td className="border p-1 text-center">
                        {buildFieldContent(
                          holding.postTransactionAmounts,
                          footnotes,
                          'postTransactionAmounts',
                        )}
                      </td>
                      <td className="border p-1 text-center">
                        {buildFieldContent(holding.ownershipNature, footnotes, 'ownershipNature')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
