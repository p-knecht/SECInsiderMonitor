import dbconnector from './dbconnector.js';
import { parseOwnershipForm } from './parser.js';

const data: Record<string, any>[] = await dbconnector.ownershipFiling.findMany({
  where: {
    formData: null,
  },
});

console.info(`Found ${data.length} incomplete filings`);

for (const entry of data) {
  const xmlData: string = entry.embeddedDocuments[0].rawContent;
  console.log(`Unparsed data: ${xmlData}`);

  const parsedFilingData: Record<string, any> = parseOwnershipForm(xmlData);
  console.log(`Parsed data: ${JSON.stringify(parsedFilingData, null, 2)}`);

  await dbconnector.ownershipFiling.update({
    where: {
      id: entry.id,
    },
    data: {
      formData: parsedFilingData,
    },
  });

  console.log('Updated previously incomplete entry');
}
