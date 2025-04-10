/**
 * Highlights the matched text in the search results (to allow user to see what part of the result matched the query).
 *
 * @param {string} textfilter - The text filter to match against.
 * @param {string} text - The text to highlight.
 * @returns {JSX.Element[]} - The text with highlighted matches.
 */
export const highlightMatch = (textFilter: string, text: string) => {
  if (!textFilter) return text;
  const escapedQuery = textFilter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex special characters to prevent side effects
  const regex = new RegExp(`(${escapedQuery.trim()})`, 'gi');
  return text.split(regex).map((part, index) =>
    regex.test(part) ? (
      <span className="font-bold" key={index}>
        {part}
      </span>
    ) : (
      part
    ),
  );
};
