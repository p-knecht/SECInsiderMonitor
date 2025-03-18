'use client';
import { OwnershipFiling } from '@prisma/client';
import { TooltipProvider } from '@/components/ui/tooltip';
import { buildFieldContent } from '@/components/main/filings/filing-details-components/filing-table-content';

/**
 * Renders a component that displays the non-derivative instruments (transactions and holdings) of the filing.
 *
 * @param {OwnershipFiling} filingData - The filing data to display the non-derivative instruments for.
 * @returns {JSX.Element} - The component that displays the non-derivative instruments (transactions and holdings) of the filing.
 */
export default function FilingNonDerivatives({ filingData }: { filingData: OwnershipFiling }) {
  // Check if there is any non derivative data to display
  if (
    !filingData.formData?.nonDerivativeTable ||
    ((!filingData.formData?.nonDerivativeTable.nonDerivativeHolding ||
      filingData.formData?.nonDerivativeTable.nonDerivativeHolding.length === 0) &&
      (!filingData.formData?.nonDerivativeTable.nonDerivativeTransaction ||
        filingData.formData?.nonDerivativeTable.nonDerivativeTransaction.length === 0))
  ) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-gray-500 text-center">
          Keine Informationen zu nicht-derivativen Instrumenten vorhanden.
        </p>
      </div>
    );
  }

  // add shortcuts for holdings, transactions and footnotes
  const holdings = filingData.formData?.nonDerivativeTable?.nonDerivativeHolding || [];
  const transactions = filingData.formData?.nonDerivativeTable?.nonDerivativeTransaction || [];
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
                    <th className="border p-1 text-center">Transaction Date</th>
                    <th className="border p-1 text-center">Deemed Execution Date</th>
                    <th className="border p-1 text-center">Transaction Coding</th>
                    <th className="border p-1 text-center">Transaction Timeliness</th>
                    <th className="border p-1 text-center">Transaction Amounts</th>
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
                    {filingData.formType == '5' && (
                      <th className="border p-1 text-center">Transaction Coding</th> // according to SEC specification only applicable to form 5
                    )}
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
