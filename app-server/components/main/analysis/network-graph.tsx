import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { NetworkAnalysisData } from '@/actions/main/analysis/analyse-network';
import { useRef } from 'react';
import { useRouter } from 'next/navigation';

// register fcose layout used for the graph
cytoscape.use(fcose);

/**
 * Function to manually build the info box with information about the selected item (node or edge)
 * (we need to use a ref for the info box and update it manually, because we don't want to rerender the graph (caused by setState) when the info box is shown/hidden)
 *
 * @param {React.RefObject<HTMLDivElement | null>} infoBoxRef - reference to the info box element to show information about the selected item
 * @param {cytoscape.SingularElementReturnValue} item - the selected item (node or edge)
 * @param {NetworkAnalysisData} data - the full data object of the network analysis
 * @param {ReturnType<typeof useRouter>} router - the router object to navigate to other pages
 * @returns {void}
 */
function showInfoBox(
  infoBoxRef: React.RefObject<HTMLDivElement | null>,
  item: cytoscape.SingularElementReturnValue,
  data: NetworkAnalysisData,
  router: ReturnType<typeof useRouter>,
) {
  if (!infoBoxRef.current) return; // return if info box reference is not available

  const isNode = item.isNode(); // check if selected item is a node or an edge
  const originalObject = item.data('fullObject');

  const title = isNode ? 'Ausgewählte Entität' : 'Ausgewählte Beziehung';
  const tableData: { [key: string]: string } = {};

  let addNetworkAnalysisButton = false;

  if (isNode) {
    const distance = (data.queryParams?.depth || 3) - originalObject.depthRemaining;
    if (distance > 0)
      // only show button if the node is not the query node
      addNetworkAnalysisButton = true;

    // build table data for nodes based on node information
    tableData['CIK der Entität'] = originalObject.cik;
    tableData['Name der Entität'] = originalObject.cikInfo.cikName;
    tableData['Ticker der Entität'] = originalObject.cikInfo.cikTicker || '';
    tableData['Distanz zur analysierten Entität'] =
      distance > 0 ? distance.toString() : '0 (Dies ist die analysierte Entität)';
    if (originalObject.depthRemaining > 0) {
      // number of owner relationships
      tableData['Anzahl der Beziehungen (als Reporting Owner)'] =
        data.edges?.filter((edge) => edge.ownerCik === originalObject.cik).length.toString() || '0';
      // number of issuer relationships
      tableData['Anzahl der Beziehungen (als Issuer)'] =
        data.edges?.filter((edge) => edge.issuerCik === originalObject.cik).length.toString() ||
        '0';
    }
  } else {
    // build table data for edges based on edge information
    tableData['Beziehungsart(en)'] = originalObject.relationTypes.join(', ');
    tableData['Datum der letzten Einreichung'] = originalObject.latestDateFiled.$date.split('T')[0];
    tableData['Noch aktiv?'] = originalObject.retiredRelation ? 'Nein' : 'Ja';

    // lookup the node information for the owner node
    const ownerNode = data.nodes?.find((node) => node.cik === originalObject.ownerCik);
    tableData['Reporting Owner (CIK)'] = originalObject.ownerCik;
    tableData['Reporting Owner (Name)'] = ownerNode?.cikInfo.cikName || 'Nicht gefunden';
    tableData['Reporting Owner (Ticker)'] = ownerNode?.cikInfo.cikTicker || '';

    // lookup the node information for the issuer node
    const issuerNode = data.nodes?.find((node) => node.cik === originalObject.issuerCik);
    tableData['Issuer (CIK)'] = originalObject.issuerCik;
    tableData['Issuer (Name)'] = issuerNode?.cikInfo.cikName || 'Nicht gefunden';
    tableData['Issuer (Ticker)'] = issuerNode?.cikInfo.cikTicker || '';
  }

  // build table rows based on defined data
  let tableRows = '';
  for (const key in tableData) {
    tableRows += `
      <tr><td class="font-medium w-36 p-1 border text-gray-700">${key}</td><td class="p-1 border">${tableData[key]}</td></tr>`;
  }

  // build full content of info box
  let content = `
    <h3 class="text-md font-semibold mb-2">${title}</h3>
    <table class="w-full text-xs border-collapse border border-gray-300 bg-white">
      <tbody>${tableRows}
      </tbody>
    </table>
    `;

  if (isNode) {
    //add buttons for nodes
    content += `
    <div class="flex flex-col gap-2 mt-3">
    <button id="open-owner-filings" class="w-full bg-white px-3 py-2 text-sm rounded hover:bg-[#f1f5f9] border-[#e2e8f0] border">
      Einreichungen (Reporting Owner) anzeigen
    </button>`;
    content += `
    <button id="open-issuer-filings" class="w-full bg-white px-3 py-2 text-sm rounded hover:bg-[#f1f5f9] border-[#e2e8f0] border">
      Einreichungen (Issuer) anzeigen
    </button>`;
    if (addNetworkAnalysisButton) {
      content += `
    <button id="open-analysis" class="w-full bg-white px-3 py-2 text-sm rounded hover:bg-[#f1f5f9] border-[#e2e8f0] border">
      Netzwerkanalyse für diese Entität starten
    </button>`;
    }
  } else {
    // add button for edges
    content += `
    <div class="flex flex-col gap-2 mt-3">
    <button id="open-filings" class="w-full bg-white px-3 py-2 text-sm rounded hover:bg-[#f1f5f9] border-[#e2e8f0] border">
      Einreichungen der Beziehung anzeigen
    </button>`;
  }
  content += `</div>`;

  // Update info box content and show it
  infoBoxRef.current.innerHTML = content;
  infoBoxRef.current.style.display = 'block';

  // Add event listeners to buttons manually (because we can't use React event listeners in this case)
  if (isNode) {
    document.getElementById('open-owner-filings')?.addEventListener('click', () => {
      router.push(
        `/filings?filter[reportingOwner]=${originalObject.cik}&filter[dateFiled][from]=${data.queryParams?.from}&filter[dateFiled][to]=${data.queryParams?.to}`,
      );
    });
    document.getElementById('open-issuer-filings')?.addEventListener('click', () => {
      router.push(
        `/filings?filter[issuer]=${originalObject.cik}&filter[dateFiled][from]=${data.queryParams?.from}&filter[dateFiled][to]=${data.queryParams?.to}`,
      );
    });
    if (addNetworkAnalysisButton) {
      document.getElementById('open-analysis')?.addEventListener('click', () => {
        window.location.href = `?cik=${originalObject.cik}&from=${data.queryParams?.from}&to=${data.queryParams?.to}&depth=${data.queryParams?.depth}`; // set and fully reload the page to reset the graph and avoid rerendering issues (note: router.push() followed by window.location.reload() may not work reliably in some browsers (e.g., Edge) due to async history handling)
      });
    }
  } else {
    document.getElementById('open-filings')?.addEventListener('click', () => {
      router.push(
        `/filings?filter[reportingOwner]=${originalObject.ownerCik}&filter[issuer]=${originalObject.issuerCik}&filter[dateFiled][from]=${data.queryParams?.from}&filter[dateFiled][to]=${data.queryParams?.to}`,
      );
    });
  }
}

/**
 * Function to hide the info box when no item is selected
 *
 * @param {React.RefObject<HTMLDivElement | null>} infoBoxRef - reference to the info box element to hide it
 * @returns {void}
 */
function hideInfoBox(infoBoxRef: React.RefObject<HTMLDivElement | null>) {
  if (!infoBoxRef.current) return;
  infoBoxRef.current.style.display = 'none';
}

/**
 * Renders a network graph based on the provided analysis data
 *
 * @param {NetworkAnalysisData} data - The data object containing the nodes and edges of the graph and query details
 * @returns {JSX.Element} - The rendered NetworkGraph component
 */
export default function NetworkGraph({ data }: { data: NetworkAnalysisData }) {
  const router = useRouter();
  const infoBoxRef = useRef<HTMLDivElement | null>(null); // we have to use useRef, because useState would cause a rerender causing the graph to be reorganized

  let selectedItem: cytoscape.SingularElementReturnValue | null = null;

  const items = [
    // define content of nodes
    ...(data.nodes ?? []).map((node) => ({
      data: {
        id: node.cik,
        label: node.cikInfo.cikTicker || '',
        fullLabel: node.cikInfo.cikTicker
          ? node.cikInfo.cikTicker + '\n' + node.cikInfo.cikName
          : node.cikInfo.cikName,
        nodeType: node.cik == data.queryParams?.cik ? 'queryNode' : 'normalNode',
        depthRemaining: node.depthRemaining,
        nodeSize: 30 + 20 * (node.depthRemaining / data.queryParams?.depth!), // set node size between 50 and 30 depending on depthRemaining
        fullObject: node,
      },
    })),

    // define content of edges
    ...(data.edges ?? []).map((edge) => ({
      data: {
        id: edge.ownerCik + '-' + edge.issuerCik,
        source: edge.issuerCik,
        target: edge.ownerCik,
        edgeType: edge.retiredRelation ? 'retiredEdge' : 'normalEdge',
        label: edge.relationTypes.join('\n'),
        fullObject: edge,
      },
    })),
  ];

  return (
    <div className="relative w-full h-full">
      <div
        ref={infoBoxRef}
        className="absolute top-3 left-3 bg-white p-3 shadow-md rounded-md border border-gray-300 z-10 w-xs "
        style={{ display: 'none' }}
      />
      <CytoscapeComponent
        elements={items}
        style={{ width: '100%', height: '100%' }}
        cy={(cy) => {
          cy.layout({
            name: 'fcose',
          }).run();

          // make sure the graph is not too small or too big
          cy.minZoom(0.5);
          cy.maxZoom(1.5);

          // add click event to items
          let lastTapTimestamp = 0;
          cy.on('tap', 'node, edge', (event) => {
            const item = event.target;

            // check if double click (within 250 ms) --> if yes, run a new query if item is suitable
            if (new Date().getTime() - lastTapTimestamp < 250) {
              // check if it is a node but not the query node --> if yes, run a new query
              if (item.isNode() && item.id() !== data.queryParams?.cik) {
                const params = new URLSearchParams();
                params.set('cik', item.id());
                params.set('from', data.queryParams?.from!);
                params.set('to', data.queryParams?.to!);
                params.set('depth', data.queryParams?.depth?.toString()!);
                window.location.href = `?${params.toString()}`; // set and fully reload the page to reset the graph and avoid rerendering issues (note: router.push() followed by window.location.reload() may not work reliably in some browsers (e.g., Edge) due to async history handling)
              }
            } else {
              // update last tap timestamp
              lastTapTimestamp = new Date().getTime();
            }

            if (selectedItem === item) {
              // if item is already selected deselect it
              selectedItem = null;
              cy.elements().removeClass('selected');

              // hide info box
              hideInfoBox(infoBoxRef);
            } else {
              // show/update info box
              showInfoBox(infoBoxRef, item, data, router);

              // set new item as selected
              selectedItem = item;

              // remove previous highlights
              cy.elements().removeClass('selected');

              // add highlights to selected item and its connected nodes and edges
              item.addClass('selected');
              item.connectedNodes().addClass('selected');
              item.connectedEdges().addClass('selected');
              item.connectedEdges().connectedNodes().addClass('selected');

              // move selected item to center
              cy.animate({
                center: { eles: item },
                duration: 600,
                easing: 'ease-in-out',
              });
            }
          });

          cy.on('tap', (event) => {
            if (event.target === cy) {
              // deselect item if clicked on background
              selectedItem = null;
              cy.elements().removeClass('selected');
              // hide info box
              hideInfoBox(infoBoxRef);
            }
          });

          // add hover effect to items
          cy.on('mouseover', 'node, edge', (event) => {
            const item = event.target;
            item.addClass('hover');
          });
          cy.on('mouseout', 'node, edge', (event) => {
            const item = event.target;
            item.removeClass('hover');
          });
        }}
        stylesheet={[
          {
            selector: 'node',
            style: {
              shape: 'ellipse',
              opacity: 0.6,
              width: 'data(nodeSize)',
              height: 'data(nodeSize)',
              'background-color': 'lightblue',
              'border-width': 1,
              'border-color': 'black',
              label: 'data(label)',
              'text-valign': 'center',
              'text-halign': 'center',
              'font-size': '10px',
              'text-wrap': 'wrap',
              'text-max-width': 'data(nodeSize)',
            },
          },
          {
            selector: 'node[nodeType="queryNode"]',
            style: {
              'background-color': 'lightgreen',
              shape: 'octagon',
            },
          },
          {
            selector: 'node.hover',
            style: {
              label: 'data(fullLabel)',
              'border-width': 2,
              opacity: 1,
              'text-background-color': 'white',
              'text-background-opacity': 0.8,
              'text-background-padding': 2,
              'text-max-width': '120px',
            },
          },
          {
            selector: 'node.selected',
            style: {
              'border-width': 2,
              opacity: 1,
            },
          },
          {
            selector: 'edge',
            style: {
              width: 1,
              'line-color': 'black',
              'line-opacity': 0.5,
              'source-arrow-color': 'black',
              'source-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'font-size': '10px',
              'text-background-color': 'white',
              'text-background-opacity': 0.8,
              'text-wrap': 'wrap',
              'text-max-width': '100px',
            },
          },
          {
            selector: 'edge[edgeType="retiredEdge"]',
            style: {
              'line-style': 'dashed',
            },
          },
          {
            selector: 'edge.selected',
            style: {
              label: 'data(label)',
              width: 2,
              'line-opacity': 1,
            },
          },
          {
            selector: 'edge.hover',
            style: {
              label: 'data(label)',
              width: 2,
              'line-opacity': 1,
            },
          },
        ]}
      />
    </div>
  );
}
