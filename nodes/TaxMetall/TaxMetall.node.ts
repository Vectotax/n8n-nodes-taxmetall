import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';
import type { JsonObject } from 'n8n-workflow';

interface StatisticEntry {
	id: string;
	name: string;
	type: string;
	parameters: string[];
}

interface StatisticsListResponse {
	success: boolean;
	count: number;
	statistics: StatisticEntry[];
}

interface WorkflowEntry {
	id: string;
	name: string;
}

interface WorkflowListResponse {
	success: boolean;
	count: number;
	data: WorkflowEntry[];
}

interface WorkflowVariableEntry {
	name: string;
	beschreibung: string;
}

/**
 * Detail response of GET /api/get-workflows?id=… — unlike the list it also
 * reports whether the workflow may be started through the API at all and which
 * variables it declares.
 */
interface WorkflowDetailResponse {
	success: boolean;
	data: {
		id: string;
		name: string;
		startbar: boolean;
		erster_block: string;
		grund: string;
		variablen: WorkflowVariableEntry[];
	};
}

/**
 * Derives the file name and MIME type of a downloaded document-sync file from the
 * response headers. Shared by the "Download Document File" and "Check & Download
 * New Documents" operations so both parse Content-Disposition identically
 * (incl. RFC 5987 percent-decoding) and fall back the same way.
 */
function parseDownloadedFileMeta(
	headers: Record<string, string>,
	fallbackFileName: string,
): { fileName: string; mimeType: string } {
	const disposition = headers['content-disposition'] ?? '';
	const fileNameMatch = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
	let fileName = fallbackFileName;
	if (fileNameMatch) {
		const raw = fileNameMatch[1].trim();
		try {
			fileName = decodeURIComponent(raw);
		} catch {
			fileName = raw;
		}
	}
	const mimeType = (headers['content-type'] ?? 'application/octet-stream').split(';')[0].trim();
	return { fileName, mimeType };
}

export class TaxMetall implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TaxMetall ERP',
		name: 'taxMetall',
		icon: 'file:TaxMetallLogo.svg',
		group: ['transform'],
		version: 1,
		description:
			'n8n integration for connecting and automating processes in the TaxMetall SQL Edition ERP system (Vectotax Software GmbH)',
		subtitle: `={{
			({
				akquise: 'Acquisition',
				offer: 'Offer',
				article: 'Article',
				auftrag: 'Order',
				anfrage: 'Purchase Inquiry',
				bestellung: 'Purchase Order',
				eingangsrechnung: 'Purchase Invoice',
				customer: 'Customer',
				kundenanfrage: 'Customer Inquiry',
				dms: 'DMS',
				documentSync: 'Document Sync',
				lieferant: 'Supplier',
				lieferschein: 'Delivery Note',
				mahnung: 'Dunning',
				rechnung: 'Invoice',
				statistics: 'Statistic',
				workflow: 'Workflow',
			}[$parameter["resource"]] ?? $parameter["resource"])
			+ ' · ' +
			({
				create: 'Create',
				getById: 'Search by ID',
				getByName: 'Search by Name',
				getByArticleNumber: 'Search by Article No.',
				getByDrawingNumber: 'Search by Drawing No.',
				getByOrderId: 'Search by Order ID',
				getByCustomer: 'Search by Customer No.',
				getByArticle: 'Search by Article',
				getBySupplier: 'Search by Supplier',
				getByDateRange: 'Search by Date Range',
				getStatus: 'Get Status',
				createFile: 'Create File',
				checkNew: 'Check New Documents',
				claimAndDownload: 'Check & Download New Documents',
				downloadFile: 'Download File',
				transferStatus: 'Transfer Status',
				createNew: 'Create Document',
				unpackMsg: 'Unpack MSG',
			}[$parameter["operation"]] ?? $parameter["operation"])
		}}`,
		defaults: {
			name: 'TaxMetall ERP',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'taxMetallApi',
				required: true,
			},
		],
		properties: [
			// ─── RESOURCE ────────────────────────────────────────────────────────────
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Acquisition', value: 'akquise' },
					{ name: 'Article', value: 'article' },
					{ name: 'Customer', value: 'customer' },
					{ name: 'Customer Inquiry', value: 'kundenanfrage' },
					{ name: 'Delivery Note', value: 'lieferschein' },
					// eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option
					{ name: 'DMS', value: 'dms' },
					{ name: 'Document Sync', value: 'documentSync' },
					{ name: 'Dunning', value: 'mahnung' },
					{ name: 'Invoice', value: 'rechnung' },
					{ name: 'Offer', value: 'offer' },
					{ name: 'Order', value: 'auftrag' },
					{ name: 'Purchase Inquiry', value: 'anfrage' },
					{ name: 'Purchase Invoice', value: 'eingangsrechnung' },
					{ name: 'Purchase Order', value: 'bestellung' },
					{ name: 'Statistic', value: 'statistics' },
					{ name: 'Supplier', value: 'lieferant' },
					{ name: 'Workflow', value: 'workflow' },
				],
				default: 'article',
			},

			// ─── OPERATIONS ───────────────────────────────────────────────────────────

			// Article
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['article'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Create an article' },
					{ name: 'Search by Article ID', value: 'getById', action: 'Search by article ID in article' },
					{ name: 'Search by Article Number', value: 'getByArticleNumber', action: 'Search by article number in article' },
					{ name: 'Search by Drawing Number', value: 'getByDrawingNumber', action: 'Search by drawing number in article' },
					{ name: 'Search by Name', value: 'getByName', action: 'Search by name in article' },
				],
				default: 'getByDrawingNumber',
				noDataExpression: true,
			},
			// Order
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['auftrag'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Create an order' },
					{ name: 'Get Order Status', value: 'getStatus', action: 'Get order status in order' },
					{ name: 'Search by Date Range', value: 'getByDateRange', action: 'Search by date range in order' },
				],
				default: 'getStatus',
				noDataExpression: true,
			},
			// Purchase Invoice
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['eingangsrechnung'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Create a purchase invoice' },
					{ name: 'Search by Date Range', value: 'getByDateRange', action: 'Search by date range in purchase invoice' },
					{ name: 'Search by Purchase Invoice No.', value: 'getById', action: 'Search by purchase invoice number in purchase invoice' },
					{ name: 'Search by Supplier', value: 'getBySupplier', action: 'Search by supplier in purchase invoice' },
				],
				default: 'getById',
				noDataExpression: true,
			},
			// Purchase Inquiry
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['anfrage'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Create a purchase inquiry' },
					{ name: 'Search by Date Range', value: 'getByDateRange', action: 'Search by date range in purchase inquiry' },
					{ name: 'Search by Inquiry No.', value: 'getById', action: 'Search by inquiry number in purchase inquiry' },
					{ name: 'Search by Supplier', value: 'getBySupplier', action: 'Search by supplier in purchase inquiry' },
				],
				default: 'getById',
				noDataExpression: true,
			},
			// Customer Inquiry
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['kundenanfrage'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Create a customer inquiry' },
					{ name: 'Search by Customer No.', value: 'getByCustomer', action: 'Search by customer number in customer inquiry' },
					{ name: 'Search by Date Range', value: 'getByDateRange', action: 'Search by date range in customer inquiry' },
					{ name: 'Search by Email', value: 'getByEmail', action: 'Search by email in customer inquiry' },
					{ name: 'Search by Inquiry No.', value: 'getById', action: 'Search by inquiry number in customer inquiry' },
				],
				default: 'getById',
				noDataExpression: true,
			},
			// Purchase Order
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['bestellung'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Create a purchase order' },
					{ name: 'Search by Date Range', value: 'getByDateRange', action: 'Search by date range in purchase order' },
					{ name: 'Search by Order No.', value: 'getById', action: 'Search by order number in purchase order' },
					{ name: 'Search by Supplier', value: 'getBySupplier', action: 'Search by supplier in purchase order' },
				],
				default: 'getById',
				noDataExpression: true,
			},
			// Customer
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['customer'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Create a customer' },
					{ name: 'Search by ID', value: 'getById', action: 'Search by ID in customer' },
					{ name: 'Search by Name', value: 'getByName', action: 'Search by name in customer' },
					{ name: 'Search by Order ID', value: 'getByOrderId', action: 'Search by order ID in customer' },
				],
				default: 'getByName',
				noDataExpression: true,
			},
			// Supplier
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['lieferant'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Create a supplier' },
					{ name: 'Search by Article', value: 'getByArticle', action: 'Search by article in supplier' },
					{ name: 'Search by ID', value: 'getById', action: 'Search by ID in supplier' },
					{ name: 'Search by Name', value: 'getByName', action: 'Search by name in supplier' },
				],
				default: 'getById',
				noDataExpression: true,
			},
			// Delivery Note
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['lieferschein'] } },
				options: [
					{ name: 'Search by Customer No.', value: 'getByCustomer', action: 'Search by customer number in delivery note' },
					{ name: 'Search by Date Range', value: 'getByDateRange', action: 'Search by date range in delivery note' },
					{ name: 'Search by Delivery Note No.', value: 'getById', action: 'Search by delivery note number in delivery note' },
				],
				default: 'getById',
				noDataExpression: true,
			},
			// DMS
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['dms'] } },
				options: [
					{ name: 'Create File', value: 'createFile', action: 'Create a file in DMS' },
				],
				default: 'createFile',
				noDataExpression: true,
			},
			// Dunning
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['mahnung'] } },
				options: [
					{ name: 'Search by Customer No.', value: 'getByCustomer', action: 'Search by customer number in dunning' },
					{ name: 'Search by Due Date Range', value: 'getByDateRange', action: 'Search by due date range in dunning' },
				],
				default: 'getByCustomer',
				noDataExpression: true,
			},
			// Invoice
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['rechnung'] } },
				options: [
					{ name: 'Search by Customer No.', value: 'getByCustomer', action: 'Search by customer number in invoice' },
					{ name: 'Search by Date Range', value: 'getByDateRange', action: 'Search by date range in invoice' },
					{ name: 'Search by Invoice No.', value: 'getById', action: 'Search by invoice number in invoice' },
				],
				default: 'getById',
				noDataExpression: true,
			},
			// Offer
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['offer'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Create an offer' },
					{ name: 'Search by Customer No.', value: 'getByCustomer', action: 'Search by customer number in offer' },
					{ name: 'Search by Date Range', value: 'getByDateRange', action: 'Search by date range in offer' },
					{ name: 'Search by Offer No.', value: 'getById', action: 'Search by offer number in offer' },
				],
				default: 'create',
				noDataExpression: true,
			},
			// Acquisition
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['akquise'] } },
				options: [
					{ name: 'Create', value: 'create', action: 'Create an acquisition' },
					{ name: 'Search by ID', value: 'getById', action: 'Search by ID in acquisition' },
					{ name: 'Search by Name', value: 'getByName', action: 'Search by name in acquisition' },
					{ name: 'Search by Date Range', value: 'getByDateRange', action: 'Search by date range in acquisition' },
				],
				default: 'create',
				noDataExpression: true,
			},

			// Statistics
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['statistics'] } },
				options: [
					{ name: 'Execute', value: 'execute', action: 'Execute a statistics report' },
				],
				default: 'execute',
				noDataExpression: true,
			},
			// Workflow
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['workflow'] } },
				options: [
					{ name: 'Execute', value: 'execute', action: 'Execute a workflow' },
					{ name: 'Get Many', value: 'getAll', action: 'Get many workflows' },
				],
				default: 'execute',
				noDataExpression: true,
			},
			// Document Sync
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: { show: { resource: ['documentSync'] } },
				options: [
					{ name: 'Check & Download New Documents', value: 'claimAndDownload', action: 'Claim and download new documents in one step' },
					{ name: 'Check New Documents', value: 'checkNew', action: 'Claim new documents from the sync queue' },
					{ name: 'Create Document', value: 'createNew', action: 'Create a document from mail data in tax metall' },
					{ name: 'Download Document File', value: 'downloadFile', action: 'Download a claimed document file' },
					{ name: 'Report Transfer Status', value: 'transferStatus', action: 'Report the share point transfer status' },
					{ name: 'Unpack MSG File', value: 'unpackMsg', action: 'Unpack a stored msg file' },
				],
				default: 'checkNew',
				noDataExpression: true,
			},

			// ─── PARAMETERS: Article ──────────────────────────────────────────────────
			{
				displayName: 'Article ID',
				name: 'articleId',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['article'], operation: ['getById'] } },
				default: '',
			},
			{
				displayName: 'Article Number',
				name: 'articleNumber',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['article'], operation: ['getByArticleNumber'] } },
				default: '',
			},
			{
				displayName: 'Name',
				name: 'articleName',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['article'], operation: ['getByName'] } },
				default: '',
			},
			{
				displayName: 'Drawing Number',
				name: 'drawingNumber',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['article'], operation: ['getByDrawingNumber'] } },
				default: '',
			},

			// ─── PARAMETERS: Article → create ────────────────────────────────────────
			{
				displayName: 'Name',
				name: 'articleCreateBezeichnung',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['article'], operation: ['create'] } },
				default: '',
				description: 'Article name / description (Bezeichnung)',
			},
			{
				displayName: 'Unit of Measure',
				name: 'articleCreateME',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['article'], operation: ['create'] } },
				default: '',
				description: 'Unit of measure (e.g. Stk, m, kg)',
				placeholder: 'Stk',
			},
			{
				displayName: 'Additional Fields',
				name: 'articleCreateAdditionalFields',
				type: 'collection',
				placeholder: 'Add field',
				default: {},
				displayOptions: { show: { resource: ['article'], operation: ['create'] } },
				options: [
					{ displayName: 'Article Number', name: 'artikelnr', type: 'string', default: '', description: 'Article number. If left empty, the next number from the configured number range is used.' },
					{ displayName: 'Bill of Materials', name: 'stueckliste', type: 'number', default: 0, description: '0 = not a bill of materials, 1 = is a bill of materials' },
					{ displayName: 'Custom Tariff Number', name: 'zolltarifnr', type: 'string', default: '' },
					{ displayName: 'Drawing Number', name: 'zeichnungsnr', type: 'string', default: '' },
					{ displayName: 'Manufacturing Indicator', name: 'fertigungskz', type: 'number', default: 0, description: 'Manufacturing key (FertigungsKz)' },
					{ displayName: 'Material', name: 'artikelwerkstoff', type: 'string', default: '', description: 'Material designation (e.g. S235, 1.4301)' },
					{ displayName: 'Preliminary', name: 'vorlaeufig', type: 'boolean', default: false, description: 'Whether to mark the article as preliminary (Vorläufig)' },
					{ displayName: 'Revision Number', name: 'revisionsnr', type: 'string', default: '' },
				],
			},

			// ─── PARAMETERS: Order ────────────────────────────────────────────────────
			{
				displayName: 'Order Number',
				name: 'auftragsNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['auftrag'], operation: ['getStatus'] } },
				default: '',
				description: 'Internal order number (Auftragnr)',
			},

			// ─── PARAMETERS: Order -> create ─────────────────────────────────────────
			{
				displayName: 'Customer ID',
				name: 'auftragCustId',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['auftrag'], operation: ['create'] } },
				default: '',
				description: 'Customer number (customerid) the order is created for',
			},
			{
				displayName: 'Positions',
				name: 'auftragPositionen',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true, sortable: true },
				placeholder: 'Add position',
				default: {},
				displayOptions: { show: { resource: ['auftrag'], operation: ['create'] } },
				description: 'One or more order positions (articles with quantity)',
				options: [
					{
						displayName: 'Position',
						name: 'position',
						values: [
							{
								displayName: 'Article ID',
								name: 'articleid',
								type: 'number',
								default: 0,
								description: 'Numeric article ID (articleid). Alternatively specify an article number below.',
							},
							{
								displayName: 'Article Number',
								name: 'artikelnr',
								type: 'string',
								default: '',
								description: 'Article number as text (artikelnr). Used when Article ID = 0.',
							},
							{
								displayName: 'Quantity',
								name: 'menge',
								type: 'number',
								default: 1,
							},
						],
					},
				],
			},
			{
				displayName: 'Additional Fields',
				name: 'auftragCreateAdditionalFields',
				type: 'collection',
				placeholder: 'Add field',
				default: {},
				displayOptions: { show: { resource: ['auftrag'], operation: ['create'] } },
				options: [
					{
						displayName: 'Create Calculation',
						name: 'kalkulation',
						type: 'boolean',
						default: false,
						description: 'Whether to freeze the bill of materials and create the calculation (work plan / material) for each position. Off by default.',
					},
				],
			},
			{
				displayName: 'Date From',
				name: 'auftragVon',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['auftrag'], operation: ['getByDateRange'] } },
				default: '',
				description: 'Start date in format yyyy-mm-dd',
				placeholder: '2024-01-01',
			},
			{
				displayName: 'Date To',
				name: 'auftragBis',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['auftrag'], operation: ['getByDateRange'] } },
				default: '',
				description: 'End date in format yyyy-mm-dd',
				placeholder: '2024-12-31',
			},

			// ─── PARAMETERS: Purchase Invoice ─────────────────────────────────────────
			{
				displayName: 'Purchase Invoice Number',
				name: 'erNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['eingangsrechnung'], operation: ['getById'] } },
				default: '',
				description: 'Purchase invoice number (ERNr)',
			},
			{
				displayName: 'Supplier Number (Optional)',
				name: 'erLieferNr',
				type: 'string',
				displayOptions: { show: { resource: ['eingangsrechnung'], operation: ['getById'] } },
				default: '',
				description: 'Supplier number to narrow results when multiple entries share the same purchase invoice number',
			},
			{
				displayName: 'Supplier Number',
				name: 'erLieferantNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['eingangsrechnung'], operation: ['getBySupplier'] } },
				default: '',
			},
			{
				displayName: 'Date From',
				name: 'erVon',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['eingangsrechnung'], operation: ['getByDateRange'] } },
				default: '',
				description: 'Start date (invoice date) in format yyyy-mm-dd',
				placeholder: '2024-01-01',
			},
			{
				displayName: 'Date To',
				name: 'erBis',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['eingangsrechnung'], operation: ['getByDateRange'] } },
				default: '',
				description: 'End date (invoice date) in format yyyy-mm-dd',
				placeholder: '2024-12-31',
			},

			// ─── PARAMETERS: Purchase Invoice — Create ────────────────────────────────
			{
				displayName: 'Input Mode',
				name: 'erCreateModus',
				type: 'options',
				displayOptions: { show: { resource: ['eingangsrechnung'], operation: ['create'] } },
				options: [
					{ name: 'E-Invoice (XRechnung / ZUGFeRD XML)', value: 'erechnung', description: 'The service reads an EN 16931 invoice file' },
					{ name: 'Parameters', value: 'parameter', description: 'Header and positions are supplied as fields' },
				],
				default: 'parameter',
				description: 'Whether to supply the invoice data as fields or as an e-invoice file',
			},
			{
				displayName: 'Invoice XML',
				name: 'erCreateXml',
				type: 'string',
				required: true,
				typeOptions: { rows: 4 },
				displayOptions: { show: { resource: ['eingangsrechnung'], operation: ['create'], erCreateModus: ['erechnung'] } },
				default: '',
				description: 'The e-invoice file as Base64 or plain XML. Pure XML only — extract the embedded XML from a ZUGFeRD PDF beforehand.',
			},
			{
				displayName: 'Discount Handling',
				name: 'erCreateRabattModus',
				type: 'options',
				displayOptions: { show: { resource: ['eingangsrechnung'], operation: ['create'], erCreateModus: ['erechnung'] } },
				options: [
					{
						name: 'As Positions',
						value: 'positionen',
						description: 'Each document-level allowance and charge becomes its own invoice line, keeping its own VAT rate',
					},
					{
						name: 'On Header',
						value: 'kopf',
						description: 'Allowances go to the absolute discount, charges to freight. Rejected when the invoice mixes VAT rates.',
					},
				],
				default: 'positionen',
				description: 'Where document-level allowances (BT-107) and charges (BT-108) are placed',
			},
			{
				displayName: 'Supplier Number',
				name: 'erCreateLieferNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['eingangsrechnung'], operation: ['create'], erCreateModus: ['parameter'] } },
				default: '',
				description: 'Supplier number (liefernr) the invoice belongs to',
			},
			{
				displayName: 'Supplier Number (Optional)',
				name: 'erCreateLieferNrOptional',
				type: 'string',
				displayOptions: { show: { resource: ['eingangsrechnung'], operation: ['create'], erCreateModus: ['erechnung'] } },
				default: '',
				description: 'Leave empty to let the service identify the supplier from the file (VAT ID, then IBAN, then exact name)',
			},
			{
				displayName: 'Purchase Invoice Number',
				name: 'erCreateErNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['eingangsrechnung'], operation: ['create'], erCreateModus: ['parameter'] } },
				default: '',
				description: 'The supplier\'s invoice number (ernr), max. 30 characters. There is no number range — it must be supplied.',
			},
			{
				displayName: 'Invoice Date',
				name: 'erCreateDatum',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['eingangsrechnung'], operation: ['create'], erCreateModus: ['parameter'] } },
				default: '',
				description: 'Invoice date in format yyyy-mm-dd',
				placeholder: '2024-01-01',
			},
			{
				displayName: 'Positions',
				name: 'erCreatePositionen',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true, sortable: true },
				placeholder: 'Add position',
				default: {},
				displayOptions: { show: { resource: ['eingangsrechnung'], operation: ['create'], erCreateModus: ['parameter'] } },
				description: 'One or more invoice positions. At least one is required.',
				options: [
					{
						displayName: 'Position',
						name: 'position',
						values: [
							{
						displayName: 'Account',
						name: 'konto',
						type: 'string',
						default: '',
						description: 'Optional G/L account. Otherwise from the article master, then the header.',
							},
							{
						displayName: 'Article Number',
						name: 'artikelnr',
						type: 'string',
						default: '',
						description: 'Optional. If given, the article must exist	—	otherwise the request is rejected. Leave empty for a free-text line.',
							},
							{
						displayName: 'Cost Center',
						name: 'kostenstellenNr',
						type: 'number',
						default: 0
							},
							{
						displayName: 'Description',
						name: 'bezeichnung',
						type: 'string',
						default: '',
						description: 'Required unless it can be taken from the article master',
							},
							{
						displayName: 'Discount	%',
						name: 'rabatt',
						type: 'number',
						default: 0
							},
							{
						displayName: 'Price Per',
						name: 'preisPro',
						type: 'number',
						default: 1,
						description: 'Price base quantity (preis_pro), e.g. 100 for a price per 100 units',
							},
							{
						displayName: 'Purchase Order No.',
						name: 'bestellNr',
						type: 'number',
						default: 0,
						description: 'Documentary reference to the purchase order	—	triggers no stock valuation',
							},
							{
						displayName: 'Purchase Order Position',
						name: 'bestellPos',
						type: 'number',
						default: 0
							},
							{
						displayName: 'Quantity',
						name: 'menge',
						type: 'number',
						default: 1
							},
							{
						displayName: 'Service Date',
						name: 'leistungsdatum',
						type: 'string',
						default: '',
						description: 'Service date in format yyyy-mm-dd. Otherwise inherited from the header.',
						placeholder: '2024-01-01',
							},
							{
						displayName: 'Total Net',
						name: 'gesamtNetto',
						type: 'number',
						default: 0,
						description: 'Optional. If set, the line amount is taken as-is instead of being calculated from quantity and price.',
							},
							{
						displayName: 'Unit Price',
						name: 'preis',
						type: 'number',
						default: 0
							},
							{
						displayName: 'VAT Key',
						name: 'mwstSchluessel',
						type: 'number',
						default: 0,
						description: 'Optional VAT key (MwStNr) to look the rate up from',
							},
							{
						displayName: 'VAT Rate	%',
						name: 'mwstSatz',
						type: 'number',
						default: 0,
						description: 'Optional. Otherwise derived from the VAT key, the article master or the header.',
							},
						],
					},
				],
			},
			{
				displayName: 'Validate Only',
				name: 'erCreateNurPruefen',
				type: 'boolean',
				displayOptions: { show: { resource: ['eingangsrechnung'], operation: ['create'] } },
				default: false,
				description: 'Whether to run all checks and the full calculation without creating anything. Useful to verify a file before committing it.',
			},
			{
				displayName: 'Additional Fields',
				name: 'erCreateAdditionalFields',
				type: 'collection',
				placeholder: 'Add field',
				default: {},
				displayOptions: { show: { resource: ['eingangsrechnung'], operation: ['create'] } },
				description: 'Optional header fields. In e-invoice mode these override the values read from the file.',
				options: [
					{
						displayName: 'Booking Text',
						name: 'buchtext',
						type: 'string',
						default: '',
						description: 'Short booking text (max. 32 characters).',
					},
					{
						displayName: 'Business Unit',
						name: 'geschbereichnr',
						type: 'number',
						default: 0,
					},
					{
						displayName: 'Cash Discount %',
						name: 'skonto',
						type: 'number',
						default: 0,
						description: 'Otherwise taken from the supplier master',
					},
					{
						displayName: 'Cash Discount Days',
						name: 'skontotage',
						type: 'number',
						default: 0,
						description: 'Otherwise taken from the supplier master',
					},
					{
						displayName: 'Cost Center',
						name: 'kostenstellennr',
						type: 'number',
						default: 0,
					},
					{
						displayName: 'Currency',
						name: 'wkz',
						type: 'string',
						default: '',
						description: 'Otherwise taken from the supplier master',
					},
					{
						displayName: 'Delivery Note No.',
						name: 'erlfsnr',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Document Type',
						name: 'typ',
						type: 'options',
						options: [
							{ name: 'Purchase Invoice', value: 1 },
							{ name: 'Credit Note', value: 2 },
							{ name: 'Down Payment Request', value: 3 },
							{ name: 'Final Invoice', value: 4 },
							{ name: 'Debit Note', value: 5 },
						],
						default: 1,
						description: 'Credit notes (2) must carry a negative total. In e-invoice mode this is derived from BT-3.',
					},
					{
						displayName: 'Freight / Postage',
						name: 'frachtkosten',
						type: 'number',
						default: 0,
					},
					{
						displayName: 'Freight With VAT',
						name: 'frachtMitMwst',
						type: 'boolean',
						default: true,
						description: 'Whether freight and transport insurance are subject to VAT',
					},
					{
						displayName: 'G/L Account',
						name: 'sachkonto',
						type: 'string',
						default: '',
						description: 'Otherwise the expense account from the supplier master',
					},
					{
						displayName: 'Net Days',
						name: 'nettotage',
						type: 'number',
						default: 0,
						description: 'Payment term in days. Otherwise from the supplier master; in e-invoice mode from the due date in the file.',
					},
					{
						displayName: 'Note',
						name: 'bemerkung',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Overall Discount Amount',
						name: 'rabattBetrag',
						type: 'number',
						default: 0,
						description: 'Absolute discount. Rejected when the invoice mixes VAT rates.',
					},
					{
						displayName: 'Project Name',
						name: 'projektname',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Project Number',
						name: 'projektnr',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Purchase Invoice Number',
						name: 'ernr',
						type: 'string',
						default: '',
						description: 'Overrides the invoice number read from the e-invoice file',
					},
					{
						displayName: 'Purchase Order No.',
						name: 'bestellnr',
						type: 'number',
						default: 0,
					},
					{
						displayName: 'Service Date',
						name: 'leistungsdatum',
						type: 'string',
						default: '',
						description: 'Service date in format yyyy-mm-dd',
						placeholder: '2024-01-01',
					},
					{
						displayName: 'VAT Key',
						name: 'mwstSchluessel',
						type: 'number',
						default: 0,
						description: 'Otherwise taken from the supplier master',
					},
					{
						displayName: 'VAT Rate %',
						name: 'mwst',
						type: 'number',
						default: 0,
						description: 'Otherwise derived from the VAT key or the positions',
					},
				],
			},

			// ─── PARAMETERS: Purchase Inquiry ─────────────────────────────────────────
			{
				displayName: 'Inquiry Number',
				name: 'anfrageNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['anfrage'], operation: ['getById'] } },
				default: '',
				description: 'Purchase inquiry number (AnfrageNr)',
			},
			{
				displayName: 'Supplier Number',
				name: 'anfrageLieferantNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['anfrage'], operation: ['getBySupplier'] } },
				default: '',
			},
			{
				displayName: 'Date From',
				name: 'anfrageVon',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['anfrage'], operation: ['getByDateRange'] } },
				default: '',
				description: 'Start date (inquiry date) in format yyyy-mm-dd',
				placeholder: '2024-01-01',
			},
			{
				displayName: 'Date To',
				name: 'anfrageBis',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['anfrage'], operation: ['getByDateRange'] } },
				default: '',
				description: 'End date (inquiry date) in format yyyy-mm-dd',
				placeholder: '2024-12-31',
			},
			{
				displayName: 'Supplier Number',
				name: 'anfrageLieferNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['anfrage'], operation: ['create'] } },
				default: '',
				description: 'Supplier number (liefernr) the inquiry is created for',
			},
			{
				displayName: 'Positions',
				name: 'anfragePositionen',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true, sortable: true },
				placeholder: 'Add position',
				default: {},
				displayOptions: { show: { resource: ['anfrage'], operation: ['create'] } },
				description: 'One or more inquiry positions (articles with quantity)',
				options: [
					{
						displayName: 'Position',
						name: 'position',
						values: [
							{
								displayName: 'Article ID',
								name: 'articleid',
								type: 'number',
								default: 0,
								description: 'Numeric article ID (articleid). Alternatively specify an article number below.',
							},
							{
								displayName: 'Article Number',
								name: 'artikelnr',
								type: 'string',
								default: '',
								description: 'Article number as text (artikelnr). Used when Article ID = 0.',
							},
							{
								displayName: 'Quantity',
								name: 'menge',
								type: 'number',
								default: 1,
							},
							{
								displayName: 'Price',
								name: 'preis',
								type: 'number',
								default: 0,
								description: 'Optional expected unit purchase price (preis)',
							},
						],
					},
				],
			},
			{
				displayName: 'Additional Fields',
				name: 'anfrageCreateAdditionalFields',
				type: 'collection',
				placeholder: 'Add field',
				default: {},
				displayOptions: { show: { resource: ['anfrage'], operation: ['create'] } },
				options: [
					{
						displayName: 'Inquiry Date',
						name: 'anfragedatum',
						type: 'string',
						default: '',
						description: 'Inquiry date in format yyyy-mm-dd. Defaults to today.',
						placeholder: '2024-01-01',
					},
				],
			},

			// ─── PARAMETERS: Customer Inquiry ───────────────────────────
			{
				displayName: 'Inquiry Number',
				name: 'kundenanfrageNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['kundenanfrage'], operation: ['getById'] } },
				default: '',
				description: 'Customer inquiry number (anfragenr). Returns the inquiry including positions and history.',
			},
			{
				displayName: 'Customer Number',
				name: 'kundenanfrageKundenNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['kundenanfrage'], operation: ['getByCustomer'] } },
				default: '',
			},
			{
				displayName: 'Email',
				name: 'kundenanfrageEmail',
				type: 'string',
				required: true,
				placeholder: 'name@email.com',
				displayOptions: { show: { resource: ['kundenanfrage'], operation: ['getByEmail'] } },
				default: '',
				description: 'Email address stored on the inquiry. Useful to match an incoming mail to an existing inquiry.',
			},
			{
				displayName: 'Date From',
				name: 'kundenanfrageVon',
				type: 'string',
				required: true,
				placeholder: '2024-01-01',
				displayOptions: { show: { resource: ['kundenanfrage'], operation: ['getByDateRange'] } },
				default: '',
				description: 'Start date (inquiry date) in format yyyy-mm-dd',
			},
			{
				displayName: 'Date To',
				name: 'kundenanfrageBis',
				type: 'string',
				required: true,
				placeholder: '2024-12-31',
				displayOptions: { show: { resource: ['kundenanfrage'], operation: ['getByDateRange'] } },
				default: '',
				description: 'End date (inquiry date) in format yyyy-mm-dd',
			},
			{
				displayName: 'Additional Filters',
				name: 'kundenanfrageFilters',
				type: 'collection',
				placeholder: 'Add filter',
				default: {},
				displayOptions: {
					show: { resource: ['kundenanfrage'], operation: ['getByCustomer', 'getByDateRange', 'getByEmail'] },
				},
				options: [
					{
						displayName: 'Customer Reference',
						name: 'kunden_anfragenr',
						type: 'string',
						default: '',
						description: 'The customer own inquiry/RFQ number stored on the inquiry',
					},
					{
						displayName: 'Customer Source',
						name: 'kunden_source',
						type: 'options',
						options: [
							{ name: 'Existing Customer', value: 'Kunden' },
							{ name: 'Prospect', value: 'Neukunden' },
						],
						default: 'Kunden',
						description: 'Whether the customer number refers to the customer master or the acquisition master',
					},
					{
						displayName: 'Document Status',
						name: 'belegstatus',
						type: 'string',
						default: '',
						description: 'Document status of the inquiry, e.g. Offen or Abgelehnt',
					},
					{
						displayName: 'Inquiry Channel',
						name: 'anfrageweg',
						type: 'string',
						default: '',
						description: 'How the inquiry arrived, e.g. E-Mail or Telefon',
					},
					{
						displayName: 'Limit',
						name: 'limit',
						type: 'number',
						typeOptions: { minValue: 1 },
						default: 50,
						description: 'Max number of results to return',
					},
					{
						displayName: 'Offer Number',
						name: 'angebotnr',
						type: 'string',
						default: '',
						description: 'Number of the offer created from the inquiry',
					},
					{
						displayName: 'Order Type',
						name: 'auftragsart',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Priority',
						name: 'prio',
						type: 'number',
						default: 0,
					},
					{
						displayName: 'Project Number',
						name: 'projektnr',
						type: 'string',
						default: '',
					},
				],
			},
			{
				displayName: 'Customer Number',
				name: 'kundenanfrageCreateKundenNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['kundenanfrage'], operation: ['create'] } },
				default: '',
				description: 'Customer number (kundennr) the inquiry is created for. For a prospect this is the KontaktNr; set Customer Source accordingly.',
			},
			{
				displayName: 'Customer Source',
				name: 'kundenanfrageCreateSource',
				type: 'options',
				displayOptions: { show: { resource: ['kundenanfrage'], operation: ['create'] } },
				options: [
					{ name: 'Existing Customer', value: 'Kunden' },
					{ name: 'Prospect', value: 'Neukunden' },
				],
				default: 'Kunden',
				description: 'Whether the customer number refers to the customer master or the acquisition master',
			},
			{
				displayName: 'Positions',
				name: 'kundenanfragePositionen',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true, sortable: true },
				placeholder: 'Add position',
				default: {},
				displayOptions: { show: { resource: ['kundenanfrage'], operation: ['create'] } },
				description: 'One or more inquiry positions. A position without an article is allowed as long as it has a description.',
				options: [
					{
						displayName: 'Position',
						name: 'position',
						values: [
							{
						displayName: 'Article ID',
						name: 'articleid',
						type: 'number',
						default: 0,
						description: 'Numeric article ID (articleid). Alternatively specify an article number below.',
							},
							{
						displayName: 'Article Number',
						name: 'artikelnr',
						type: 'string',
						default: '',
						description: 'Article number as text (artikelnr). Used when Article ID	=	0.',
							},
							{
						displayName: 'Customer Article Number',
						name: 'kundenartikelnr',
						type: 'string',
						default: '',
							},
							{
						displayName: 'Description',
						name: 'bezeichnung',
						type: 'string',
						default: '',
						description: 'Free text description. Required for a position without an article, e.g. a new part from a drawing.',
							},
							{
						displayName: 'Drawing Number',
						name: 'zeichnungnr',
						type: 'string',
						default: '',
							},
							{
						displayName: 'Info Text',
						name: 'infotext',
						type: 'string',
						default: '',
							},
							{
						displayName: 'Quantity',
						name: 'menge',
						type: 'number',
						default: 1
							},
							{
						displayName: 'Requested Delivery Date',
						name: 'liefertermin',
						type: 'string',
						placeholder: '2024-01-01',
						default: '',
						description: 'Requested delivery date in format yyyy-mm-dd',
							},
							{
						displayName: 'Revision Number',
						name: 'revisionsnr',
						type: 'string',
						default: '',
							},
							{
						displayName: 'Unit',
						name: 'mengeneinheit',
						type: 'string',
						default: '',
							},
							{
						displayName: 'Value',
						name: 'wert',
						type: 'number',
						default: 0,
						description: 'Estimated position value. The sum over all positions is written to the inquiry header.',
							},
						],
					},
				],
			},
			{
				displayName: 'Additional Fields',
				name: 'kundenanfrageCreateAdditionalFields',
				type: 'collection',
				placeholder: 'Add field',
				default: {},
				displayOptions: { show: { resource: ['kundenanfrage'], operation: ['create'] } },
				options: [
					{
						displayName: 'Commission Number',
						name: 'komissionsnr',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Contact Person',
						name: 'anfrageperson',
						type: 'string',
						default: '',
						description: 'Name of the contact person on the customer side',
					},
					{
						displayName: 'Contact Person Number',
						name: 'anfragepersonnr',
						type: 'number',
						default: 0,
						description: 'Contact person number (PartnerNr). Name, email and phone are then taken from the contact record.',
					},
					{
						displayName: 'Customer Reference',
						name: 'kunden_anfragenr',
						type: 'string',
						default: '',
						description: 'The customer own inquiry/RFQ number',
					},
					{
						displayName: 'Document Status',
						name: 'belegstatus',
						type: 'string',
						default: '',
						description: 'Document status of the inquiry, e.g. Offen',
					},
					{
						displayName: 'Due Date',
						name: 'abgabetermin',
						type: 'string',
						placeholder: '2024-01-01',
						default: '',
						description: 'Date the quotation is due, in format yyyy-mm-dd',
					},
					{
						displayName: 'Email',
						name: 'emailadresse',
						type: 'string',
						placeholder: 'name@email.com',
						default: '',
						description: 'Overrides the email address taken from the customer master',
					},
					{
						displayName: 'Estimated Value',
						name: 'schaetzwert',
						type: 'string',
						default: '',
						description: 'Must match an entry of the ERP selection list Schaetzwert',
					},
					{
						displayName: 'Inquiry Channel',
						name: 'anfrageweg',
						type: 'string',
						default: '',
						description: 'How the inquiry arrived, e.g. E-Mail or Telefon',
					},
					{
						displayName: 'Inquiry Date',
						name: 'anfragedatum',
						type: 'string',
						placeholder: '2024-01-01',
						default: '',
						description: 'Inquiry date in format yyyy-mm-dd. Defaults to today.',
					},
					{
						displayName: 'Inquiry Received',
						name: 'anfrageeingang',
						type: 'string',
						placeholder: '2024-01-01',
						default: '',
						description: 'Date the inquiry was received, in format yyyy-mm-dd',
					},
					{
						displayName: 'Note',
						name: 'notiz',
						type: 'string',
						typeOptions: { rows: 4 },
						default: '',
					},
					{
						displayName: 'Order Type',
						name: 'auftragsart',
						type: 'string',
						default: '',
						description: 'Must match an entry of the ERP selection list Auftragsart',
					},
					{
						displayName: 'Priority',
						name: 'prio',
						type: 'number',
						default: 0,
					},
					{
						displayName: 'Project Name',
						name: 'projektname',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Project Number',
						name: 'projektnr',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Subject',
						name: 'betreff',
						type: 'string',
						default: '',
						description: 'Subject line of the inquiry. Must match an entry of the ERP selection list KAnfrageBetreff.',
					},
				],
			},
			{
				displayName: 'History Entry',
				name: 'kundenanfrageHistorie',
				type: 'collection',
				placeholder: 'Add history field',
				default: {},
				displayOptions: { show: { resource: ['kundenanfrage'], operation: ['create'] } },
				description: 'Optional first entry in the inquiry history. Leave empty to skip.',
				options: [
					{
						displayName: 'Contact Person',
						name: 'ansprechpartner',
						type: 'string',
						default: '',
					},
					{
						displayName: 'Contact Type',
						name: 'kontaktart',
						type: 'string',
						default: '',
						description: 'Must match an entry of the ERP selection list VerlaufKontakt',
					},
					{
						displayName: 'Follow-Up Date',
						name: 'wiedervorlage',
						type: 'string',
						placeholder: '2024-01-01',
						default: '',
						description: 'Follow-up date in format yyyy-mm-dd',
					},
					{
						displayName: 'Info',
						name: 'info',
						type: 'string',
						typeOptions: { rows: 3 },
						default: '',
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'string',
						default: '',
						description: 'Must match an entry of the ERP selection list VerlaufStatus',
					},
					{
						displayName: 'Text',
						name: 'text',
						type: 'string',
						default: '',
						description: 'Must match an entry of the ERP selection list Verlauftext',
					},
					{
						displayName: 'Type',
						name: 'typ',
						type: 'string',
						default: '',
						description: 'Must match an entry of the ERP selection list Verlauftyp',
					},
				],
			},

			// ─── PARAMETERS: Purchase Order ───────────────────────────────────────────
			{
				displayName: 'Order Number',
				name: 'bestellungNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['bestellung'], operation: ['getById'] } },
				default: '',
				description: 'Purchase order number (BestellNr)',
			},
			{
				displayName: 'Supplier Number',
				name: 'bestellungLieferantNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['bestellung'], operation: ['getBySupplier'] } },
				default: '',
			},
			{
				displayName: 'Date From',
				name: 'bestellungVon',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['bestellung'], operation: ['getByDateRange'] } },
				default: '',
				description: 'Start date (order date) in format yyyy-mm-dd',
				placeholder: '2024-01-01',
			},
			{
				displayName: 'Date To',
				name: 'bestellungBis',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['bestellung'], operation: ['getByDateRange'] } },
				default: '',
				description: 'End date (order date) in format yyyy-mm-dd',
				placeholder: '2024-12-31',
			},
			{
				displayName: 'Supplier Number',
				name: 'bestellungLieferNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['bestellung'], operation: ['create'] } },
				default: '',
				description: 'Supplier number (liefernr) the order is created for',
			},
			{
				displayName: 'Positions',
				name: 'bestellungPositionen',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true, sortable: true },
				placeholder: 'Add position',
				default: {},
				displayOptions: { show: { resource: ['bestellung'], operation: ['create'] } },
				description: 'One or more order positions (articles with quantity)',
				options: [
					{
						displayName: 'Position',
						name: 'position',
						values: [
							{
						displayName: 'Article ID',
						name: 'articleid',
						type: 'number',
						default: 0,
						description: 'Numeric article ID (articleid). Alternatively specify an article number below.',
							},
							{
						displayName: 'Article Number',
						name: 'artikelnr',
						type: 'string',
						default: '',
						description: 'Article number as text (artikelnr). Used when Article ID	=	0.',
							},
							{
						displayName: 'Discount	%',
						name: 'rabatt',
						type: 'number',
						default: 0,
						description: 'Position discount in percent (rabatt)',
							},
							{
						displayName: 'Price',
						name: 'preis',
						type: 'number',
						default: 0,
						description: 'Unit purchase price (preis)',
							},
							{
						displayName: 'Price Per',
						name: 'preispro',
						type: 'number',
						default: 1,
						description: 'Price base quantity (preispro), e.g. 100 for price per 100 units',
							},
							{
						displayName: 'Quantity',
						name: 'menge',
						type: 'number',
						default: 1
							},
						],
					},
				],
			},
			{
				displayName: 'Additional Fields',
				name: 'bestellungCreateAdditionalFields',
				type: 'collection',
				placeholder: 'Add field',
				default: {},
				displayOptions: { show: { resource: ['bestellung'], operation: ['create'] } },
				options: [
					{
						displayName: 'Book to Disposition',
						name: 'dispo',
						type: 'boolean',
						default: false,
						description: 'Whether to book the order into disposition (writes ArtikelBestellt). Off by default.',
					},
					{
						displayName: 'Order Date',
						name: 'bestelldatum',
						type: 'string',
						default: '',
						description: 'Order date in format yyyy-mm-dd. Defaults to today.',
						placeholder: '2024-01-01',
					},
				],
			},

			// ─── PARAMETERS: Customer ─────────────────────────────────────────────────
			{
				displayName: 'Customer Name',
				name: 'customerName',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['customer'], operation: ['getByName'] } },
				default: '',
			},
			{
				displayName: 'Customer ID',
				name: 'customerId',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['customer'], operation: ['getById'] } },
				default: '',
			},
			{
				displayName: 'Order ID',
				name: 'orderId',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['customer'], operation: ['getByOrderId'] } },
				default: '',
			},

			// ─── PARAMETERS: Customer → create ───────────────────────────────────────
			{
				displayName: 'Company Name',
				name: 'customerCreateName',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['customer'], operation: ['create'] } },
				default: '',
			},
			{
				displayName: 'Additional Fields',
				name: 'customerCreateAdditionalFields',
				type: 'collection',
				placeholder: 'Add field',
				default: {},
				displayOptions: { show: { resource: ['customer'], operation: ['create'] } },
				options: [
					{ displayName: 'City', name: 'ort', type: 'string', default: '' },
					{ displayName: 'Country', name: 'staat', type: 'string', default: '' },
					{ displayName: 'Email', name: 'emailadresse', type: 'string', default: '' },
					{ displayName: 'ISO Country Code', name: 'isolkz', type: 'string', default: '', description: 'Two-letter ISO country code (e.g. DE, AT, CH)' },
					{ displayName: 'Name Addition', name: 'namenzusatz', type: 'string', default: '' },
					{ displayName: 'Phone', name: 'telefon', type: 'string', default: '' },
					{ displayName: 'Postal Code', name: 'plz', type: 'string', default: '' },
					{ displayName: 'Street', name: 'strasse', type: 'string', default: '' },
					{ displayName: 'Website', name: 'internetadresse', type: 'string', default: '' },
				],
			},

			// ─── PARAMETERS: Supplier ─────────────────────────────────────────────────
			{
				displayName: 'Supplier Number',
				name: 'lieferantId',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['lieferant'], operation: ['getById'] } },
				default: '',
			},
			{
				displayName: 'Name',
				name: 'lieferantName',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['lieferant'], operation: ['getByName'] } },
				default: '',
				description: 'Search by partial match on supplier name',
			},
			{
				displayName: 'Article Number',
				name: 'lieferantArtikelNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['lieferant'], operation: ['getByArticle'] } },
				default: '',
				description: 'Article number from the supplier-article assignment table',
			},

			// ─── PARAMETERS: Supplier → create ───────────────────────────────────────
			{
				displayName: 'Company Name',
				name: 'lieferantCreateName',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['lieferant'], operation: ['create'] } },
				default: '',
			},
			{
				displayName: 'Additional Fields',
				name: 'lieferantCreateAdditionalFields',
				type: 'collection',
				placeholder: 'Add field',
				default: {},
				displayOptions: { show: { resource: ['lieferant'], operation: ['create'] } },
				options: [
					{ displayName: 'City', name: 'ort', type: 'string', default: '' },
					{ displayName: 'Country', name: 'staat', type: 'string', default: '' },
					{ displayName: 'Email', name: 'emailadresse', type: 'string', default: '' },
					{ displayName: 'ISO Country Code', name: 'isolkz', type: 'string', default: '', description: 'Two-letter ISO country code (e.g. DE, AT, CH)' },
					{ displayName: 'Name Addition', name: 'namenzusatz', type: 'string', default: '' },
					{ displayName: 'Phone', name: 'telefon', type: 'string', default: '' },
					{ displayName: 'Postal Code', name: 'plz', type: 'string', default: '' },
					{ displayName: 'Street', name: 'strasse', type: 'string', default: '' },
					{ displayName: 'Website', name: 'internetadresse', type: 'string', default: '' },
				],
			},

			// ─── PARAMETERS: Delivery Note ────────────────────────────────────────────
			{
				displayName: 'Delivery Note Number',
				name: 'lieferscheinNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['lieferschein'], operation: ['getById'] } },
				default: '',
			},
			{
				displayName: 'Customer Number',
				name: 'lieferscheinKundenNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['lieferschein'], operation: ['getByCustomer'] } },
				default: '',
			},
			{
				displayName: 'Date From',
				name: 'lieferscheinVon',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['lieferschein'], operation: ['getByDateRange'] } },
				default: '',
				description: 'Start date in format yyyy-mm-dd',
				placeholder: '2024-01-01',
			},
			{
				displayName: 'Date To',
				name: 'lieferscheinBis',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['lieferschein'], operation: ['getByDateRange'] } },
				default: '',
				description: 'End date in format yyyy-mm-dd',
				placeholder: '2024-12-31',
			},

			// ─── PARAMETERS: Dunning ──────────────────────────────────────────────────
			{
				displayName: 'Customer Number',
				name: 'mahnungKundenNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['mahnung'], operation: ['getByCustomer'] } },
				default: '',
			},
			{
				displayName: 'Optional Filters',
				name: 'mahnungFilterKunde',
				type: 'collection',
				placeholder: 'Add filter',
				default: {},
				displayOptions: { show: { resource: ['mahnung'], operation: ['getByCustomer'] } },
				options: [
					{
						displayName: 'Due Date From',
						name: 'von',
						type: 'string',
						default: '',
						description: 'Optional date filter: start date (due date) in format yyyy-mm-dd',
						placeholder: '2024-01-01',
					},
					{
						displayName: 'Due Date To',
						name: 'bis',
						type: 'string',
						default: '',
						description: 'Optional date filter: end date (due date) in format yyyy-mm-dd',
						placeholder: '2024-12-31',
					},
					{
						displayName: 'Dunning Level',
						name: 'mahnstufe',
						type: 'number',
						default: 0,
						description: 'Show only items of this dunning level (0 = all)',
					},
					{
						displayName: 'Include Blocked',
						name: 'mahnsperre',
						type: 'boolean',
						default: false,
						description: 'Whether to include items with dunning block',
					},
					{
						displayName: 'Include Paid',
						name: 'bezahlt',
						type: 'boolean',
						default: false,
						description: 'Whether to include paid items (NotPayed = 0)',
					},
				],
			},
			{
				displayName: 'Due Date From',
				name: 'mahnungVon',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['mahnung'], operation: ['getByDateRange'] } },
				default: '',
				description: 'Start date (due date) in format yyyy-mm-dd',
				placeholder: '2024-01-01',
			},
			{
				displayName: 'Due Date To',
				name: 'mahnungBis',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['mahnung'], operation: ['getByDateRange'] } },
				default: '',
				description: 'End date (due date) in format yyyy-mm-dd',
				placeholder: '2024-12-31',
			},
			{
				displayName: 'Optional Filters',
				name: 'mahnungFilter',
				type: 'collection',
				placeholder: 'Add filter',
				default: {},
				displayOptions: { show: { resource: ['mahnung'], operation: ['getByDateRange'] } },
				options: [
					{
						displayName: 'Dunning Level',
						name: 'mahnstufe',
						type: 'number',
						default: 0,
						description: 'Show only items of this dunning level (0 = all)',
					},
					{
						displayName: 'Include Blocked',
						name: 'mahnsperre',
						type: 'boolean',
						default: false,
						description: 'Whether to include items with dunning block',
					},
					{
						displayName: 'Include Paid',
						name: 'bezahlt',
						type: 'boolean',
						default: false,
						description: 'Whether to include paid items (NotPayed = 0)',
					},
				],
			},

			// ─── PARAMETERS: Invoice ──────────────────────────────────────────────────
			{
				displayName: 'Invoice Number',
				name: 'rechnungNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['rechnung'], operation: ['getById'] } },
				default: '',
			},
			{
				displayName: 'Customer Number',
				name: 'rechnungKundenNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['rechnung'], operation: ['getByCustomer'] } },
				default: '',
			},
			{
				displayName: 'Date From',
				name: 'rechnungVon',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['rechnung'], operation: ['getByDateRange'] } },
				default: '',
				description: 'Start date (invoice date) in format yyyy-mm-dd',
				placeholder: '2024-01-01',
			},
			{
				displayName: 'Date To',
				name: 'rechnungBis',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['rechnung'], operation: ['getByDateRange'] } },
				default: '',
				description: 'End date (invoice date) in format yyyy-mm-dd',
				placeholder: '2024-12-31',
			},

			// ─── PARAMETERS: Offer ────────────────────────────────────────────────────
			{
				displayName: 'Customer ID',
				name: 'offerCustId',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['offer'], operation: ['create'] } },
				default: '',
			},
			{
				displayName: 'Article ID',
				name: 'offerArtId',
				type: 'number',
				displayOptions: { show: { resource: ['offer'], operation: ['create'] } },
				default: 0,
				description: 'Numeric article ID (articleid). Alternatively specify an article number in the field below.',
			},
			{
				displayName: 'Article Number',
				name: 'offerArtNr',
				type: 'string',
				displayOptions: { show: { resource: ['offer'], operation: ['create'] } },
				default: '',
				description: 'Article number as text (artikelnr). Used when Article ID = 0.',
			},
			{
				displayName: 'Quantity',
				name: 'amount',
				type: 'number',
				displayOptions: { show: { resource: ['offer'], operation: ['create'] } },
				default: 1,
			},
			{
				displayName: 'Offer Number',
				name: 'angebotNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['offer'], operation: ['getById'] } },
				default: '',
			},
			{
				displayName: 'Customer Number',
				name: 'offerKundenNr',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['offer'], operation: ['getByCustomer'] } },
				default: '',
			},
			{
				displayName: 'Date From',
				name: 'offerVon',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['offer'], operation: ['getByDateRange'] } },
				default: '',
				description: 'Start date (offer date) in format yyyy-mm-dd',
				placeholder: '2024-01-01',
			},
			{
				displayName: 'Date To',
				name: 'offerBis',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['offer'], operation: ['getByDateRange'] } },
				default: '',
				description: 'End date (offer date) in format yyyy-mm-dd',
				placeholder: '2024-12-31',
			},

			// ─── PARAMETERS: Acquisition ──────────────────────────────────────────────
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				required: true,
				displayOptions: { show: { resource: ['akquise'], operation: ['create'] } },
				default: '',
			},
			{
				displayName: 'Company',
				name: 'company',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['akquise'], operation: ['create'] } },
				default: '',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add field',
				default: {},
				displayOptions: { show: { resource: ['akquise'], operation: ['create'] } },
				options: [
					{ displayName: 'Campaign Info', name: 'kampagneninfo', type: 'string', default: '' },
					{ displayName: 'City', name: 'ort', type: 'string', default: '' },
					{ displayName: 'Country', name: 'land', type: 'string', default: '' },
					{ displayName: 'First Name', name: 'vorname', type: 'string', default: '' },
					{ displayName: 'Last Name', name: 'nachname', type: 'string', default: '' },
					{ displayName: 'Lead Source', name: 'leadquelle', type: 'string', default: '' },
					{
						displayName: 'Perspective Lead ID',
						name: 'perspectiveLeadId',
						type: 'string',
						default: '',
					},
					{ displayName: 'Phone', name: 'telefon', type: 'string', default: '' },
					{ displayName: 'Postal Code', name: 'plz', type: 'string', default: '' },
					{ displayName: 'Street', name: 'strasse', type: 'string', default: '' },
				],
			},
			{
				displayName: 'Acquisition ID',
				name: 'akquiseId',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['akquise'], operation: ['getById'] } },
				default: '',
				description: 'Internal acquisition contact number (KontaktNr)',
			},
			{
				displayName: 'Name',
				name: 'akquiseName',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['akquise'], operation: ['getByName'] } },
				default: '',
				description: 'Search by partial match on company or contact name',
			},
			{
				displayName: 'Date From',
				name: 'akquiseVon',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['akquise'], operation: ['getByDateRange'] } },
				default: '',
				description: 'Start date (first contact date) in format yyyy-mm-dd',
				placeholder: '2024-01-01',
			},
			{
				displayName: 'Date To',
				name: 'akquiseBis',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['akquise'], operation: ['getByDateRange'] } },
				default: '',
				description: 'End date (first contact date) in format yyyy-mm-dd',
				placeholder: '2024-12-31',
			},
			// ─── PARAMETERS: Statistics ───────────────────────────────────────────────
			{
				displayName: 'Statistics / Report Name or ID',
				name: 'statisticId',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getStatistics' },
				default: '',
				required: true,
				noDataExpression: true,
				displayOptions: { show: { resource: ['statistics'], operation: ['execute'] } },
				description: 'Select the report to execute. The option description shows which parameters it requires. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Date From',
				name: 'statDatumVon',
				type: 'dateTime',
				default: '',
				displayOptions: { show: { resource: ['statistics'], operation: ['execute'] } },
				description: 'Start date of the reporting period (SQL parameter: DatumVon)',
			},
			{
				displayName: 'Date To',
				name: 'statDatumBis',
				type: 'dateTime',
				default: '',
				displayOptions: { show: { resource: ['statistics'], operation: ['execute'] } },
				description: 'End date of the reporting period (SQL parameter: DatumBis)',
			},
			{
				displayName: 'Comparison From',
				name: 'statVergleichVon',
				type: 'dateTime',
				default: '',
				displayOptions: { show: { resource: ['statistics'], operation: ['execute'] } },
				description: 'Start date of a comparison period (SQL parameter: VergleichVon)',
			},
			{
				displayName: 'Comparison To',
				name: 'statVergleichBis',
				type: 'dateTime',
				default: '',
				displayOptions: { show: { resource: ['statistics'], operation: ['execute'] } },
				description: 'End date of a comparison period (SQL parameter: VergleichBis)',
			},
			{
				displayName: 'Additional Parameters',
				name: 'statWeitereParameter',
				type: 'collection',
				placeholder: 'Add parameter',
				default: {},
				displayOptions: { show: { resource: ['statistics'], operation: ['execute'] } },
				description: 'Optional filter parameters — which ones are required is shown in the report description above',
				options: [
					{ displayName: 'Article Group', name: 'ArtikelGruppe', type: 'string', default: '', description: 'SQL parameter: ArtikelGruppe' },
					{ displayName: 'Article No.', name: 'Artikel', type: 'string', default: '', description: 'SQL parameter: Artikel' },
					{ displayName: 'Business Area', name: 'GeschBereich', type: 'string', default: '', description: 'SQL parameter: GeschBereich' },
					{ displayName: 'Customer No.', name: 'Kunden', type: 'string', default: '', description: 'SQL parameter: Kunden' },
					{ displayName: 'Employee', name: 'Mitarbeiter', type: 'string', default: '', description: 'SQL parameter: Mitarbeiter' },
					{ displayName: 'Offer No.', name: 'Angebot', type: 'string', default: '', description: 'SQL parameter: Angebot' },
					{ displayName: 'Offer Position', name: 'AngebotsPos', type: 'string', default: '', description: 'SQL parameter: AngebotsPos' },
					{ displayName: 'Order No.', name: 'Auftrag', type: 'string', default: '', description: 'SQL parameter: Auftrag' },
					{ displayName: 'Order Position', name: 'AuftragsPos', type: 'string', default: '', description: 'SQL parameter: AuftragsPos' },
					{ displayName: 'Order Type', name: 'AuftragsArt', type: 'string', default: '', description: 'SQL parameter: AuftragsArt' },
					{ displayName: 'Project No.', name: 'Projekt', type: 'string', default: '', description: 'SQL parameter: Projekt' },
					{ displayName: 'Purchase Order No.', name: 'Bestellung', type: 'string', default: '', description: 'SQL parameter: Bestellung' },
					{ displayName: 'Purchase Order Position', name: 'BestellPos', type: 'string', default: '', description: 'SQL parameter: BestellPos' },
					{ displayName: 'Supplier No.', name: 'Lieferanten', type: 'string', default: '', description: 'SQL parameter: Lieferanten' },
					{ displayName: 'Value Range From', name: 'WertebereichVon', type: 'number', default: 0, description: 'SQL parameter: WertebereichVon' },
					{ displayName: 'Value Range To', name: 'WertebereichBis', type: 'number', default: 0, description: 'SQL parameter: WertebereichBis' },
					{ displayName: 'Variable 1', name: 'Variable1', type: 'string', default: '', description: 'SQL parameter: Variable1' },
					{ displayName: 'Warehouse', name: 'Lagerort', type: 'string', default: '', description: 'SQL parameter: Lagerort' },
				],
			},

			// ─── PARAMETERS: Workflow ─────────────────────────────────────────────────
			{
				displayName: 'Workflow Name or ID',
				name: 'workflowId',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getWorkflows' },
				default: '',
				required: true,
				noDataExpression: true,
				displayOptions: { show: { resource: ['workflow'], operation: ['execute'] } },
				description: 'Select the TaxMetall workflow to start. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				// The available variables differ per workflow, so the name field is a
				// dropdown that reloads whenever another workflow is selected.
				displayName: 'Variables',
				name: 'workflowVariables',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true, sortable: true },
				placeholder: 'Add variable',
				default: {},
				displayOptions: { show: { resource: ['workflow'], operation: ['execute'] } },
				description: 'Initial values handed to the workflow. Only variables declared in the selected workflow are accepted.',
				options: [
					{
						displayName: 'Variable',
						name: 'variable',
						values: [
							{
								displayName: 'Name or ID',
								name: 'name',
								type: 'options',
								typeOptions: { loadOptionsMethod: 'getWorkflowVariables', loadOptionsDependsOn: ['workflowId'] },
								default: '',
								description: 'Variable declared in the selected workflow. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Value to set before the workflow starts',
							},
						],
					},
				],
			},
			{
				displayName: 'Strict Variable Check',
				name: 'workflowStrict',
				type: 'boolean',
				default: true,
				displayOptions: { show: { resource: ['workflow'], operation: ['execute'] } },
				description: 'Whether unknown variable names make the call fail. Turn off to silently ignore them, which is how the ERP behaves.',
			},

			// ─── PARAMETERS: DMS ──────────────────────────────────────────────────────────
			{
				displayName: 'Data (JSON)',
				name: 'dmsData',
				type: 'json',
				required: true,
				displayOptions: { show: { resource: ['dms'], operation: ['createFile'] } },
				default: '{}',
			},
			{
				displayName: 'File (Binary)',
				name: 'dmsBinaryProperty',
				type: 'string',
				required: true,
				default: 'data',
				displayOptions: { show: { resource: ['dms'], operation: ['createFile'] } },
				description: 'Name of the binary property that contains the file (e.g. "data")',
			},

			// ─── PARAMETERS: Document Sync ────────────────────────────────────────────
			// Check New Documents
			{
				displayName: 'Limit',
				name: 'docSyncLimit',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 50,
				displayOptions: { show: { resource: ['documentSync'], operation: ['checkNew', 'claimAndDownload'] } },
				description: 'Max number of documents to claim from the queue in one call. The service caps this at its configured maximum.',
			},

			// Download Document File / Report Transfer Status — shared identifiers
			{
				displayName: 'Sync ID',
				name: 'docSyncId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['documentSync'], operation: ['downloadFile', 'transferStatus'] } },
				description: 'The syncId of the queue entry, as returned by Check New Documents',
			},

			// Download Document File
			{
				displayName: 'Put Output File in Field',
				name: 'docSyncBinaryProperty',
				type: 'string',
				required: true,
				default: 'data',
				displayOptions: { show: { resource: ['documentSync'], operation: ['downloadFile', 'claimAndDownload'] } },
				description: 'Name of the binary property to write the downloaded file to',
			},
			{
				displayName: 'Unpack MSG/EML',
				name: 'docSyncUnpackMail',
				type: 'boolean',
				default: false,
				displayOptions: { show: { resource: ['documentSync'], operation: ['downloadFile', 'claimAndDownload'] } },
				description: 'Whether to deliver .msg/.eml documents automatically unpacked as JSON (meta/body/attachments, attachments Base64) instead of the raw file. The service detects the format; other file types are returned unchanged as a binary file (no error). When unpacked, the item carries JSON instead of a binary.',
			},

			// Report Transfer Status
			{
				displayName: 'Success',
				name: 'docSyncSuccess',
				type: 'string',
				default: 'true',
				displayOptions: { show: { resource: ['documentSync'], operation: ['transferStatus'] } },
				description: 'Whether the SharePoint transfer succeeded. This is a text field so you can pass the result from a previous step via an expression. Truthy values (case-insensitive): true, 1, yes, success; anything else counts as failed. On failure the entry stays in the queue and is retried on the next poll.',
			},
			{
				displayName: 'Payload Fields',
				name: 'docSyncPayloadFields',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true, sortable: false },
				default: {},
				placeholder: 'Add Field',
				displayOptions: { show: { resource: ['documentSync'], operation: ['transferStatus'] } },
				description:
					'Custom key/value pairs stored as the entry payload (flat JSON) when Success is true — e.g. Key "sharePointUrl" with the uploaded URL from a previous node. On a later DELETE event the whole payload is returned so you can act on it (e.g. remove the file from SharePoint). Keys must be non-empty and unique. Values are sent as strings.',
				options: [
					{
						name: 'field',
						displayName: 'Field',
						values: [
							{ displayName: 'Key', name: 'key', type: 'string', default: '' },
							{ displayName: 'Value', name: 'value', type: 'string', default: '' },
						],
					},
				],
			},
			{
				displayName: 'Error Message',
				name: 'docSyncError',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['documentSync'], operation: ['transferStatus'] } },
				description: 'Error text to record for the failed transfer (used when Success is false). The service logs it; the entry is retried unconditionally on the next poll.',
			},

			// Create Document (create-new-dokument)
			{
				displayName: 'Area (Bereich)',
				name: 'createDokumentBereich',
				type: 'options',
				required: true,
				default: 'Auftrag_s',
				displayOptions: { show: { resource: ['documentSync'], operation: ['createNew'] } },
				description: 'Target area the document is attached to. Position documents are attached to the article and use Article plus the article number.',
				options: [
					{ name: 'Article', value: 'Artikel_s' },
					{ name: 'Customer', value: 'Kunden_s' },
					{ name: 'Customer Inquiry', value: 'Kundenanfrage' },
					{ name: 'Delivery Note', value: 'Lieferschein_s' },
					{ name: 'Inquiry', value: 'Anfrage_s' },
					{ name: 'Invoice', value: 'Rechnung_s' },
					{ name: 'Offer', value: 'Angebot_s' },
					{ name: 'Order', value: 'Auftrag_s' },
					{ name: 'Project', value: 'Projekt' },
					{ name: 'Purchase Invoice', value: 'ER' },
					{ name: 'Purchase Order', value: 'Bestellung_s' },
					{ name: 'Supplier', value: 'Liefer_s' },
				],
			},
			{
				displayName: 'Document Number (Belegnummer)',
				name: 'createDokumentBelegnummer',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['documentSync'], operation: ['createNew'] } },
				description: 'Number of the target record the document is attached to. For position documents use the article number and area Article.',
			},
			{
				displayName: 'SharePoint URL',
				name: 'createDokumentSharePointUrl',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['documentSync'], operation: ['createNew'] } },
				description:
					'Optional source SharePoint URL of the document. If set, it is stored under Payload.sharePoint.mainUrl. Leave empty to create the document without a SharePoint reference (e.g. when the export to storage is handled later by WF1 / Check New Documents).',
			},
			{
				displayName: 'Email To',
				name: 'createDokumentEmailAn',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['documentSync'], operation: ['createNew'] } },
				description: 'Recipient address for the generated .eml (email.an). Required when the service generates the .eml.',
			},
			{
				displayName: 'Email Fields',
				name: 'createDokumentEmailFields',
				type: 'collection',
				placeholder: 'Add email field',
				default: {},
				displayOptions: { show: { resource: ['documentSync'], operation: ['createNew'] } },
				description: 'Further fields of the source email used to build the .eml',
				options: [
					{ displayName: 'Date', name: 'datum', type: 'dateTime', default: '', description: 'Date the mail was received (email.datum), ISO 8601' },
					{ displayName: 'From', name: 'von', type: 'string', default: '', description: 'Sender address (email.von)' },
					{ displayName: 'HTML', name: 'html', type: 'string', typeOptions: { rows: 4 }, default: '', description: 'HTML body (email.html). Provide Text or HTML.' },
					{ displayName: 'Message ID', name: 'messageId', type: 'string', default: '', description: 'Unique message ID (email.messageId). Used for deduplication.' },
					{ displayName: 'Subject', name: 'betreff', type: 'string', default: '', description: 'Email subject (email.betreff)' },
					{ displayName: 'Text', name: 'text', type: 'string', typeOptions: { rows: 4 }, default: '', description: 'Plain text body (email.text). Provide Text or HTML.' },
				],
			},
			{
				displayName: 'Attach All Input Binary Fields',
				name: 'createDokumentAttachAllBinaries',
				type: 'boolean',
				default: false,
				displayOptions: { show: { resource: ['documentSync'], operation: ['createNew'] } },
				description: 'Whether to attach every binary property present on the input item automatically (variable number of files). When on, the Attachments list below is ignored; file name and MIME type are taken from each binary.',
			},
			{
				displayName: 'Attachments',
				name: 'createDokumentAttachments',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true, sortable: true },
				placeholder: 'Add attachment',
				default: {},
				displayOptions: { show: { resource: ['documentSync'], operation: ['createNew'], createDokumentAttachAllBinaries: [false] } },
				description: 'Optional attachments for the generated .eml',
				options: [
					{
						displayName: 'Attachment',
						name: 'attachment',
						values: [
							{
								displayName: 'Input Binary Field',
								name: 'binaryProperty',
								type: 'string',
								default: '',
								description: 'Name of the n8n binary property to attach. If set, its content is Base64-encoded automatically and file name / MIME type are taken from it unless overridden below.',
							},
							{
								displayName: 'File Name',
								name: 'dateiname',
								type: 'string',
								default: '',
								description: 'Attachment file name (dateiname). Overrides the binary file name.',
							},
							{
								displayName: 'MIME Type',
								name: 'mimeType',
								type: 'string',
								default: '',
								description: 'Attachment MIME type. Overrides the binary MIME type.',
							},
							{
								displayName: 'Content (Base64)',
								name: 'inhaltBase64',
								type: 'string',
								default: '',
								description: 'Base64-encoded content (inhaltBase64). Used when no Input Binary Field is set.',
							},
						],
					},
				],
			},
			{
				displayName: 'Allow Duplicates',
				name: 'createDokumentAllowDuplicates',
				type: 'boolean',
				default: false,
				displayOptions: { show: { resource: ['documentSync'], operation: ['createNew'] } },
				description: 'Whether to skip deduplication. When off (default), a document with an already-seen email.messageId is not created again and duplicate=true is returned.',
			},
			{
				displayName: 'Also Export to Storage (Disable Loop Guard)',
				name: 'createDokumentSuppressLoopGuard',
				type: 'boolean',
				default: false,
				displayOptions: { show: { resource: ['documentSync'], operation: ['createNew'] } },
				description: 'Whether the created document should also be queued for export (WF1). Off by default: imported documents are not re-exported. Enable to mirror the document to your external storage (e.g. SharePoint) as well.',
			},

			// Unpack MSG (unpack-msg)
			{
				displayName: 'File Name',
				name: 'unpackMsgDateiname',
				type: 'string',
				required: true,
				default: '',
				displayOptions: { show: { resource: ['documentSync'], operation: ['unpackMsg'] } },
				description: 'Name of the stored .msg file. A bare file name is resolved against the ERP mail folder (SDTMP); a full path is used as-is.',
			},
			{
				displayName: 'Include Attachment Content',
				name: 'unpackMsgIncludeContent',
				type: 'boolean',
				default: true,
				displayOptions: { show: { resource: ['documentSync'], operation: ['unpackMsg'] } },
				description: 'Whether to include each attachment\'s Base64 content (contentBase64). Turn off for a faster metadata-only listing; sizeBytes is always included.',
			},
		],
		usableAsTool: true,
	};

	methods = {
		loadOptions: {
			async getStatistics(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('taxMetallApi');
				const baseUrl = credentials.baseUrl as string;
				const loadTlsOption = credentials.allowSelfSignedCertificates === true
					? { skipSslCertificateValidation: true as const }
					: {};
				const response = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
					method: 'GET',
					url: `${baseUrl}/api/statistics/list`,
					json: true,
					...loadTlsOption,
				}) as StatisticsListResponse;
				if (!response.success || !Array.isArray(response.statistics)) return [];
				return response.statistics.map((stat) => ({
					name: stat.name,
					value: stat.id,
					description: stat.parameters.length > 0
						? `Required parameters: ${stat.parameters.join(', ')}`
						: 'No parameters required',
				}));
			},

			async getWorkflows(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('taxMetallApi');
				const baseUrl = credentials.baseUrl as string;
				const loadTlsOption = credentials.allowSelfSignedCertificates === true
					? { skipSslCertificateValidation: true as const }
					: {};
				const response = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
					method: 'GET',
					url: `${baseUrl}/api/get-workflows`,
					json: true,
					...loadTlsOption,
				}) as WorkflowListResponse;
				if (!response.success || !Array.isArray(response.data)) return [];
				return response.data.map((wf) => ({
					name: wf.name,
					value: wf.id,
				}));
			},

			async getWorkflowVariables(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const workflowId = this.getCurrentNodeParameter('workflowId') as string;
				if (!workflowId) return [];

				const credentials = await this.getCredentials('taxMetallApi');
				const baseUrl = credentials.baseUrl as string;
				const loadTlsOption = credentials.allowSelfSignedCertificates === true
					? { skipSslCertificateValidation: true as const }
					: {};
				const response = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
					method: 'GET',
					url: `${baseUrl}/api/get-workflows`,
					qs: { id: workflowId },
					json: true,
					...loadTlsOption,
				}) as WorkflowDetailResponse;
				if (!response.success || !response.data || !Array.isArray(response.data.variablen)) return [];

				// Every TaxMetall workflow carries the same twelve document-number
				// variables. They are pushed to the bottom so the ones specific to the
				// selected workflow are visible without scrolling.
				const boilerplate = new Set([
					'AngebotNr', 'AnfrageNr', 'AuftragNr', 'BestellungNr', 'DateinameDMS', 'erstelltAus',
					'KundeNr', 'LieferNr', 'LieferscheinNr', 'newUserID', 'Position', 'RechnungNr',
				]);
				const rank = (name: string) => (boilerplate.has(name) ? 1 : 0);

				return response.data.variablen
					.slice()
					.sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name))
					.map((v) => ({
						name: v.name,
						value: v.name,
						description: v.beschreibung || undefined,
					}));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('taxMetallApi');

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				let responseData;

				const headers: Record<string, string> = {
					'Content-Type': 'application/json',
				};
				if (credentials.useNgrok === true) {
					headers['ngrok-skip-browser-warning'] = 'true';
				}

				const baseUrl = credentials.baseUrl as string;
				const tlsOption = credentials.allowSelfSignedCertificates === true
					? { skipSslCertificateValidation: true as const }
					: {};

				// ── Article ────────────────────────────────────────────────────────────
				if (resource === 'article') {
					if (operation === 'create') {
						const additionalFields = this.getNodeParameter('articleCreateAdditionalFields', i) as Record<string, unknown>;
						const articleBody: Record<string, unknown> = {
							bezeichnung: this.getNodeParameter('articleCreateBezeichnung', i),
							mengeneinheit: this.getNodeParameter('articleCreateME', i),
						};
						if (additionalFields.artikelnr) articleBody.artikelnr = additionalFields.artikelnr;
						if (additionalFields.zeichnungsnr) articleBody.zeichnungsnr = additionalFields.zeichnungsnr;
						if (additionalFields.revisionsnr) articleBody.revisionsnr = additionalFields.revisionsnr;
						if (additionalFields.fertigungskz && (additionalFields.fertigungskz as number) > 0) articleBody.fertigungskz = additionalFields.fertigungskz;
						if (additionalFields.stueckliste !== undefined) articleBody.stueckliste = additionalFields.stueckliste;
						if (additionalFields.artikelwerkstoff) articleBody.artikelwerkstoff = additionalFields.artikelwerkstoff;
						if (additionalFields.zolltarifnr) articleBody.zolltarifnr = additionalFields.zolltarifnr;
						if (additionalFields.vorlaeufig !== undefined) articleBody.vorlaeufig = additionalFields.vorlaeufig;
						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'POST',
							url: `${baseUrl}/api/create-article`,
							body: articleBody,
							headers,
							json: true,
							...tlsOption,
						});
					} else {
						const qs: Record<string, string> = {};
						if (operation === 'getById') {
							qs.aid = this.getNodeParameter('articleId', i) as string;
						} else if (operation === 'getByArticleNumber') {
							qs.artikelnr = this.getNodeParameter('articleNumber', i) as string;
						} else if (operation === 'getByName') {
							qs.name = this.getNodeParameter('articleName', i) as string;
						} else if (operation === 'getByDrawingNumber') {
							qs.zeichnungsnr = this.getNodeParameter('drawingNumber', i) as string;
						}
						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'GET',
							url: `${baseUrl}/api/get-articles`,
							qs,
							headers,
							json: true,
							...tlsOption,
						});
					}

				// ── Customer Inquiry ────────────────────────────────────────
				} else if (resource === 'kundenanfrage') {
					if (operation === 'create') {
						const positionenRaw = this.getNodeParameter('kundenanfragePositionen', i, {}) as {
							position?: Array<{
								articleid?: number;
								artikelnr?: string;
								bezeichnung?: string;
								menge?: number;
								mengeneinheit?: string;
								zeichnungnr?: string;
								revisionsnr?: string;
								kundenartikelnr?: string;
								infotext?: string;
								wert?: number;
								liefertermin?: string;
							}>;
						};
						const additionalFields = this.getNodeParameter('kundenanfrageCreateAdditionalFields', i, {}) as Record<string, unknown>;
						const historie = this.getNodeParameter('kundenanfrageHistorie', i, {}) as Record<string, unknown>;

						const kundenNr = this.getNodeParameter('kundenanfrageCreateKundenNr', i) as string;
						if (!kundenNr) {
							throw new NodeOperationError(this.getNode(), 'Customer Number is required.', { itemIndex: i });
						}

						const positionsInput = positionenRaw.position ?? [];
						if (positionsInput.length === 0) {
							throw new NodeOperationError(this.getNode(), 'At least one position is required.', { itemIndex: i });
						}
						const positionen = positionsInput.map((pos, idx) => {
							const entry: Record<string, unknown> = { menge: pos.menge ?? 1 };
							if (pos.articleid && pos.articleid !== 0) {
								entry.articleid = pos.articleid;
							} else if (pos.artikelnr) {
								entry.artikelnr = pos.artikelnr;
							} else if (!pos.bezeichnung) {
								// Freitextposition ohne Artikel braucht wenigstens eine Bezeichnung
								throw new NodeOperationError(
									this.getNode(),
									`Position ${idx + 1}: an Article ID, Article Number or Description is required.`,
									{ itemIndex: i },
								);
							}
							if (pos.bezeichnung) entry.bezeichnung = pos.bezeichnung;
							if (pos.mengeneinheit) entry.mengeneinheit = pos.mengeneinheit;
							if (pos.zeichnungnr) entry.zeichnungnr = pos.zeichnungnr;
							if (pos.revisionsnr) entry.revisionsnr = pos.revisionsnr;
							if (pos.kundenartikelnr) entry.kundenartikelnr = pos.kundenartikelnr;
							if (pos.infotext) entry.infotext = pos.infotext;
							if (pos.wert) entry.wert = pos.wert;
							if (pos.liefertermin) entry.liefertermin = pos.liefertermin;
							return entry;
						});

						const kundenanfrageBody: Record<string, unknown> = {
							kundennr: kundenNr,
							kunden_source: this.getNodeParameter('kundenanfrageCreateSource', i) as string,
							positionen,
						};
						Object.assign(kundenanfrageBody, additionalFields);
						if (Object.keys(historie).length > 0) kundenanfrageBody.historie = historie;

						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'POST',
							url: `${baseUrl}/api/create-customer-inquiry`,
							body: kundenanfrageBody,
							headers,
							json: true,
							...tlsOption,
						});
					} else {
						const qs: Record<string, string> = {};
						if (operation === 'getById') {
							qs.anfragenr = this.getNodeParameter('kundenanfrageNr', i) as string;
						} else {
							if (operation === 'getByCustomer') {
								qs.kundennr = this.getNodeParameter('kundenanfrageKundenNr', i) as string;
							} else if (operation === 'getByEmail') {
								qs.email = this.getNodeParameter('kundenanfrageEmail', i) as string;
							} else if (operation === 'getByDateRange') {
								qs.von = this.getNodeParameter('kundenanfrageVon', i) as string;
								qs.bis = this.getNodeParameter('kundenanfrageBis', i) as string;
							}
							const filters = this.getNodeParameter('kundenanfrageFilters', i, {}) as Record<string, unknown>;
							for (const [key, value] of Object.entries(filters)) {
								if (value !== undefined && value !== null && value !== '') qs[key] = String(value);
							}
						}
						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'GET',
							url: `${baseUrl}/api/get-customer-inquiries`,
							qs,
							headers,
							json: true,
							...tlsOption,
						});
					}

				// ── Order ──────────────────────────────────────────────────────────────
				} else if (resource === 'auftrag') {
					if (operation === 'create') {
						const positionenRaw = this.getNodeParameter('auftragPositionen', i, {}) as {
							position?: Array<{ articleid?: number; artikelnr?: string; menge?: number }>;
						};
						const additionalFields = this.getNodeParameter('auftragCreateAdditionalFields', i, {}) as Record<string, unknown>;

						const customerId = this.getNodeParameter('auftragCustId', i) as string;
						if (!customerId) {
							throw new NodeOperationError(this.getNode(), 'Customer ID is required.', { itemIndex: i });
						}

						const positionsInput = positionenRaw.position ?? [];
						if (positionsInput.length === 0) {
							throw new NodeOperationError(this.getNode(), 'At least one position is required.', { itemIndex: i });
						}
						const positionen = positionsInput.map((pos, idx) => {
							const entry: Record<string, unknown> = { menge: pos.menge ?? 1 };
							if (pos.articleid && pos.articleid !== 0) {
								entry.articleid = pos.articleid;
							} else if (pos.artikelnr) {
								entry.artikelnr = pos.artikelnr;
							} else {
								throw new NodeOperationError(
									this.getNode(),
									`Position ${idx + 1}: an Article ID or Article Number is required.`,
									{ itemIndex: i },
								);
							}
							return entry;
						});
						const auftragBody: Record<string, unknown> = {
							customerid: customerId,
							positionen,
						};
						if (additionalFields.kalkulation !== undefined) auftragBody.kalkulation = additionalFields.kalkulation;
						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'POST',
							url: `${baseUrl}/api/create-order`,
							body: auftragBody,
							headers,
							json: true,
							...tlsOption,
						});
					} else {
						const qs: Record<string, string> = {};
						if (operation === 'getStatus') {
							qs.auftragnr = this.getNodeParameter('auftragsNr', i) as string;
						} else if (operation === 'getByDateRange') {
							qs.von = this.getNodeParameter('auftragVon', i) as string;
							qs.bis = this.getNodeParameter('auftragBis', i) as string;
						}
						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'GET',
							url: `${baseUrl}/api/get-orders`,
							qs,
							headers,
							json: true,
							...tlsOption,
						});
					}

				// ── Purchase Invoice ───────────────────────────────────────────────────
				} else if (resource === 'eingangsrechnung' && operation === 'create') {
					const modus = this.getNodeParameter('erCreateModus', i) as string;
					const additionalFields = this.getNodeParameter('erCreateAdditionalFields', i, {}) as Record<string, unknown>;
					const nurPruefen = this.getNodeParameter('erCreateNurPruefen', i, false) as boolean;
					const erBody: Record<string, unknown> = {};

					if (modus === 'erechnung') {
						const xml = (this.getNodeParameter('erCreateXml', i) as string ?? '').trim();
						if (!xml) {
							throw new NodeOperationError(this.getNode(), 'Invoice XML is required in e-invoice mode.', { itemIndex: i });
						}
						erBody.modus = 'erechnung';
						erBody.xml = xml;
						erBody.rabatt_modus = this.getNodeParameter('erCreateRabattModus', i, 'positionen') as string;
						const lieferNr = (this.getNodeParameter('erCreateLieferNrOptional', i, '') as string ?? '').trim();
						if (lieferNr) erBody.liefernr = lieferNr;
					} else {
						const lieferNr = (this.getNodeParameter('erCreateLieferNr', i) as string ?? '').trim();
						if (!lieferNr) {
							throw new NodeOperationError(this.getNode(), 'Supplier Number is required.', { itemIndex: i });
						}
						const erNr = (this.getNodeParameter('erCreateErNr', i) as string ?? '').trim();
						if (!erNr) {
							throw new NodeOperationError(this.getNode(), 'Purchase Invoice Number is required.', { itemIndex: i });
						}
						erBody.liefernr = lieferNr;
						erBody.ernr = erNr;
						erBody.datum = this.getNodeParameter('erCreateDatum', i) as string;

						const positionenRaw = this.getNodeParameter('erCreatePositionen', i, {}) as {
							position?: Array<{
								artikelnr?: string; bezeichnung?: string; menge?: number; preis?: number;
								preisPro?: number; rabatt?: number; gesamtNetto?: number; mwstSatz?: number;
								mwstSchluessel?: number; konto?: string; kostenstellenNr?: number;
								bestellNr?: number; bestellPos?: number; leistungsdatum?: string;
							}>;
						};
						const positionsInput = positionenRaw.position ?? [];
						if (positionsInput.length === 0) {
							throw new NodeOperationError(this.getNode(), 'At least one position is required.', { itemIndex: i });
						}
						erBody.positionen = positionsInput.map((pos, idx) => {
							if (!pos.artikelnr && !pos.bezeichnung) {
								throw new NodeOperationError(
									this.getNode(),
									`Position ${idx + 1}: an Article Number or a Description is required.`,
									{ itemIndex: i },
								);
							}
							const entry: Record<string, unknown> = {};
							if (pos.artikelnr) entry.artikelnr = pos.artikelnr;
							if (pos.bezeichnung) entry.bezeichnung = pos.bezeichnung;
							if (pos.menge !== undefined) entry.menge = pos.menge;
							if (pos.preis !== undefined) entry.preis = pos.preis;
							if (pos.preisPro) entry.preis_pro = pos.preisPro;
							if (pos.rabatt) entry.rabatt = pos.rabatt;
							if (pos.gesamtNetto) entry.gesamt_netto = pos.gesamtNetto;
							if (pos.mwstSatz) entry.mwst_satz = pos.mwstSatz;
							if (pos.mwstSchluessel) entry.mwst_schluessel = pos.mwstSchluessel;
							if (pos.konto) entry.konto = pos.konto;
							if (pos.kostenstellenNr) entry.kostenstellennr = pos.kostenstellenNr;
							if (pos.bestellNr) entry.bestellnr = pos.bestellNr;
							if (pos.bestellPos) entry.bestellpos = pos.bestellPos;
							if (pos.leistungsdatum) entry.leistungsdatum = pos.leistungsdatum;
							return entry;
						});
					}

					if (nurPruefen) erBody.nur_pruefen = true;

					// Kopffelder: leere Werte werden bewusst nicht gesendet, damit im
					// E-Rechnungsmodus die Angaben aus der Datei bestehen bleiben.
					if (additionalFields.ernr) erBody.ernr = additionalFields.ernr;
					if (additionalFields.typ) erBody.typ = additionalFields.typ;
					if (additionalFields.leistungsdatum) erBody.leistungsdatum = additionalFields.leistungsdatum;
					if (additionalFields.nettotage !== undefined) erBody.nettotage = additionalFields.nettotage;
					if (additionalFields.skontotage !== undefined) erBody.skontotage = additionalFields.skontotage;
					if (additionalFields.skonto !== undefined) erBody.skonto = additionalFields.skonto;
					if (additionalFields.mwstSchluessel) erBody.mwst_schluessel = additionalFields.mwstSchluessel;
					if (additionalFields.mwst !== undefined) erBody.mwst = additionalFields.mwst;
					if (additionalFields.sachkonto) erBody.sachkonto = additionalFields.sachkonto;
					if (additionalFields.wkz) erBody.wkz = additionalFields.wkz;
					if (additionalFields.frachtkosten) erBody.frachtkosten = additionalFields.frachtkosten;
					if (additionalFields.rabattBetrag) erBody.rabatt_betrag = additionalFields.rabattBetrag;
					if (additionalFields.frachtMitMwst !== undefined) erBody.fracht_mit_mwst = additionalFields.frachtMitMwst;
					if (additionalFields.bestellnr) erBody.bestellnr = additionalFields.bestellnr;
					if (additionalFields.projektnr) erBody.projektnr = additionalFields.projektnr;
					if (additionalFields.projektname) erBody.projektname = additionalFields.projektname;
					if (additionalFields.kostenstellennr) erBody.kostenstellennr = additionalFields.kostenstellennr;
					if (additionalFields.geschbereichnr) erBody.geschbereichnr = additionalFields.geschbereichnr;
					if (additionalFields.buchtext) erBody.buchtext = additionalFields.buchtext;
					if (additionalFields.bemerkung) erBody.bemerkung = additionalFields.bemerkung;
					if (additionalFields.erlfsnr) erBody.erlfsnr = additionalFields.erlfsnr;

					responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
						method: 'POST',
						url: `${baseUrl}/api/create-purchase-invoice`,
						body: erBody,
						headers,
						json: true,
						...tlsOption,
					});

				} else if (resource === 'eingangsrechnung') {
					const qs: Record<string, string> = {};
					if (operation === 'getById') {
						qs.ernr = this.getNodeParameter('erNr', i) as string;
						const erLieferNr = this.getNodeParameter('erLieferNr', i) as string;
						if (erLieferNr) qs.liefernr = erLieferNr;
					} else if (operation === 'getBySupplier') {
						qs.liefernr = this.getNodeParameter('erLieferantNr', i) as string;
					} else if (operation === 'getByDateRange') {
						qs.von = this.getNodeParameter('erVon', i) as string;
						qs.bis = this.getNodeParameter('erBis', i) as string;
					}
					responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
						method: 'GET',
						url: `${baseUrl}/api/get-purchase-invoices`,
						qs,
						headers,
						json: true,
						...tlsOption,
					});

				// ── Purchase Inquiry ───────────────────────────────────────────────────
				} else if (resource === 'anfrage') {
					if (operation === 'create') {
						const positionenRaw = this.getNodeParameter('anfragePositionen', i, {}) as {
							position?: Array<{ articleid?: number; artikelnr?: string; menge?: number; preis?: number }>;
						};
						const additionalFields = this.getNodeParameter('anfrageCreateAdditionalFields', i, {}) as Record<string, unknown>;

						const lieferNr = this.getNodeParameter('anfrageLieferNr', i) as string;
						if (!lieferNr) {
							throw new NodeOperationError(this.getNode(), 'Supplier Number is required.', { itemIndex: i });
						}

						const positionsInput = positionenRaw.position ?? [];
						if (positionsInput.length === 0) {
							throw new NodeOperationError(this.getNode(), 'At least one position is required.', { itemIndex: i });
						}
						const positionen = positionsInput.map((pos, idx) => {
							const entry: Record<string, unknown> = { menge: pos.menge ?? 1 };
							if (pos.articleid && pos.articleid !== 0) {
								entry.articleid = pos.articleid;
							} else if (pos.artikelnr) {
								entry.artikelnr = pos.artikelnr;
							} else {
								throw new NodeOperationError(
									this.getNode(),
									`Position ${idx + 1}: an Article ID or Article Number is required.`,
									{ itemIndex: i },
								);
							}
							if (pos.preis !== undefined) entry.preis = pos.preis;
							return entry;
						});
						const anfrageBody: Record<string, unknown> = {
							liefernr: lieferNr,
							positionen,
						};
						if (additionalFields.anfragedatum) anfrageBody.anfragedatum = additionalFields.anfragedatum;
						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'POST',
							url: `${baseUrl}/api/create-purchase-inquiry`,
							body: anfrageBody,
							headers,
							json: true,
							...tlsOption,
						});
					} else {
						const qs: Record<string, string> = {};
						if (operation === 'getById') {
							qs.anfragenr = this.getNodeParameter('anfrageNr', i) as string;
						} else if (operation === 'getBySupplier') {
							qs.liefernr = this.getNodeParameter('anfrageLieferantNr', i) as string;
						} else if (operation === 'getByDateRange') {
							qs.von = this.getNodeParameter('anfrageVon', i) as string;
							qs.bis = this.getNodeParameter('anfrageBis', i) as string;
						}
						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'GET',
							url: `${baseUrl}/api/get-purchase-inquiries`,
							qs,
							headers,
							json: true,
							...tlsOption,
						});
					}

				// ── Purchase Order ─────────────────────────────────────────────────────
				} else if (resource === 'bestellung') {
					if (operation === 'create') {
						const positionenRaw = this.getNodeParameter('bestellungPositionen', i, {}) as {
							position?: Array<{ articleid?: number; artikelnr?: string; menge?: number; preis?: number; rabatt?: number; preispro?: number }>;
						};
						const additionalFields = this.getNodeParameter('bestellungCreateAdditionalFields', i, {}) as Record<string, unknown>;

						const lieferNr = this.getNodeParameter('bestellungLieferNr', i) as string;
						if (!lieferNr) {
							throw new NodeOperationError(this.getNode(), 'Supplier Number is required.', { itemIndex: i });
						}

						const positionsInput = positionenRaw.position ?? [];
						if (positionsInput.length === 0) {
							throw new NodeOperationError(this.getNode(), 'At least one position is required.', { itemIndex: i });
						}
						const positionen = positionsInput.map((pos, idx) => {
							const entry: Record<string, unknown> = { menge: pos.menge ?? 1 };
							if (pos.articleid && pos.articleid !== 0) {
								entry.articleid = pos.articleid;
							} else if (pos.artikelnr) {
								entry.artikelnr = pos.artikelnr;
							} else {
								throw new NodeOperationError(
									this.getNode(),
									`Position ${idx + 1}: an Article ID or Article Number is required.`,
									{ itemIndex: i },
								);
							}
							if (pos.preis !== undefined) entry.preis = pos.preis;
							if (pos.rabatt !== undefined) entry.rabatt = pos.rabatt;
							if (pos.preispro !== undefined) entry.preispro = pos.preispro;
							return entry;
						});
						const bestellungBody: Record<string, unknown> = {
							liefernr: lieferNr,
							positionen,
						};
						if (additionalFields.bestelldatum) bestellungBody.bestelldatum = additionalFields.bestelldatum;
						if (additionalFields.dispo !== undefined) bestellungBody.dispo = additionalFields.dispo;
						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'POST',
							url: `${baseUrl}/api/create-purchase-order`,
							body: bestellungBody,
							headers,
							json: true,
							...tlsOption,
						});
					} else {
						const qs: Record<string, string> = {};
						if (operation === 'getById') {
							qs.bestellnr = this.getNodeParameter('bestellungNr', i) as string;
						} else if (operation === 'getBySupplier') {
							qs.liefernr = this.getNodeParameter('bestellungLieferantNr', i) as string;
						} else if (operation === 'getByDateRange') {
							qs.von = this.getNodeParameter('bestellungVon', i) as string;
							qs.bis = this.getNodeParameter('bestellungBis', i) as string;
						}
						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'GET',
							url: `${baseUrl}/api/get-purchase-orders`,
							qs,
							headers,
							json: true,
							...tlsOption,
						});
					}

				// ── Customer ───────────────────────────────────────────────────────────
				} else if (resource === 'customer') {
					if (operation === 'create') {
						const additionalFields = this.getNodeParameter('customerCreateAdditionalFields', i) as Record<string, string>;
						const customerBody: Record<string, unknown> = {
							name: this.getNodeParameter('customerCreateName', i),
						};
						if (additionalFields.namenzusatz) customerBody.namenzusatz = additionalFields.namenzusatz;
						if (additionalFields.strasse) customerBody.strasse = additionalFields.strasse;
						if (additionalFields.plz) customerBody.plz = additionalFields.plz;
						if (additionalFields.ort) customerBody.ort = additionalFields.ort;
						if (additionalFields.staat) customerBody.staat = additionalFields.staat;
						if (additionalFields.isolkz) customerBody.isolkz = additionalFields.isolkz;
						if (additionalFields.internetadresse) customerBody.internetadresse = additionalFields.internetadresse;
						if (additionalFields.emailadresse) customerBody.emailadresse = additionalFields.emailadresse;
						if (additionalFields.telefon) customerBody.telefon = additionalFields.telefon;
						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'POST',
							url: `${baseUrl}/api/create-customer`,
							body: customerBody,
							headers,
							json: true,
							...tlsOption,
						});
					} else {
						const qs: Record<string, string> = {};
						if (operation === 'getByName') {
							qs.name = this.getNodeParameter('customerName', i) as string;
						} else if (operation === 'getById') {
							qs.kundennr = this.getNodeParameter('customerId', i) as string;
						} else if (operation === 'getByOrderId') {
							qs.auftragnr = this.getNodeParameter('orderId', i) as string;
						}
						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'GET',
							url: `${baseUrl}/api/get-customers`,
							qs,
							headers,
							json: true,
							...tlsOption,
						});
					}

				// ── Supplier ───────────────────────────────────────────────────────────
				} else if (resource === 'lieferant') {
					if (operation === 'create') {
						const additionalFields = this.getNodeParameter('lieferantCreateAdditionalFields', i) as Record<string, string>;
						const lieferantBody: Record<string, unknown> = {
							name: this.getNodeParameter('lieferantCreateName', i),
						};
						if (additionalFields.namenzusatz) lieferantBody.namenzusatz = additionalFields.namenzusatz;
						if (additionalFields.strasse) lieferantBody.strasse = additionalFields.strasse;
						if (additionalFields.plz) lieferantBody.plz = additionalFields.plz;
						if (additionalFields.ort) lieferantBody.ort = additionalFields.ort;
						if (additionalFields.staat) lieferantBody.staat = additionalFields.staat;
						if (additionalFields.isolkz) lieferantBody.isolkz = additionalFields.isolkz;
						if (additionalFields.internetadresse) lieferantBody.internetadresse = additionalFields.internetadresse;
						if (additionalFields.emailadresse) lieferantBody.emailadresse = additionalFields.emailadresse;
						if (additionalFields.telefon) lieferantBody.telefon = additionalFields.telefon;
						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'POST',
							url: `${baseUrl}/api/create-supplier`,
							body: lieferantBody,
							headers,
							json: true,
							...tlsOption,
						});
					} else {
						const qs: Record<string, string> = {};
						if (operation === 'getById') {
							qs.liefernr = this.getNodeParameter('lieferantId', i) as string;
						} else if (operation === 'getByName') {
							qs.name = this.getNodeParameter('lieferantName', i) as string;
						} else if (operation === 'getByArticle') {
							qs.artikelnr = this.getNodeParameter('lieferantArtikelNr', i) as string;
						}
						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'GET',
							url: `${baseUrl}/api/get-suppliers`,
							qs,
							headers,
							json: true,
							...tlsOption,
						});
					}

				// ── Delivery Note ──────────────────────────────────────────────────────
				} else if (resource === 'lieferschein') {
					const qs: Record<string, string> = {};
					if (operation === 'getById') {
						qs.lieferscheinnr = this.getNodeParameter('lieferscheinNr', i) as string;
					} else if (operation === 'getByCustomer') {
						qs.kundennr = this.getNodeParameter('lieferscheinKundenNr', i) as string;
					} else if (operation === 'getByDateRange') {
						qs.von = this.getNodeParameter('lieferscheinVon', i) as string;
						qs.bis = this.getNodeParameter('lieferscheinBis', i) as string;
					}
					responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
						method: 'GET',
						url: `${baseUrl}/api/get-delivery-notes`,
						qs,
						headers,
						json: true,
						...tlsOption,
					});

				// ── Dunning ────────────────────────────────────────────────────────────
				} else if (resource === 'mahnung') {
					const qs: Record<string, string> = {};
					if (operation === 'getByCustomer') {
						const filterKunde = this.getNodeParameter('mahnungFilterKunde', i) as Record<string, unknown>;
						qs.kundennr = this.getNodeParameter('mahnungKundenNr', i) as string;
						if (filterKunde.mahnstufe && (filterKunde.mahnstufe as number) > 0)
							qs.mahnstufe = String(filterKunde.mahnstufe);
						if (filterKunde.bezahlt === true) qs.bezahlt = 'true';
						if (filterKunde.mahnsperre === true) qs.mahnsperre = 'true';
						if (filterKunde.von) qs.von = filterKunde.von as string;
						if (filterKunde.bis) qs.bis = filterKunde.bis as string;
					} else if (operation === 'getByDateRange') {
						const filter = this.getNodeParameter('mahnungFilter', i) as Record<string, unknown>;
						qs.von = this.getNodeParameter('mahnungVon', i) as string;
						qs.bis = this.getNodeParameter('mahnungBis', i) as string;
						if (filter.mahnstufe && (filter.mahnstufe as number) > 0)
							qs.mahnstufe = String(filter.mahnstufe);
						if (filter.bezahlt === true) qs.bezahlt = 'true';
						if (filter.mahnsperre === true) qs.mahnsperre = 'true';
					}
					responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
						method: 'GET',
						url: `${baseUrl}/api/get-dunning`,
						qs,
						headers,
						json: true,
						...tlsOption,
					});

				// ── Invoice ────────────────────────────────────────────────────────────
				} else if (resource === 'rechnung') {
					const qs: Record<string, string> = {};
					if (operation === 'getById') {
						qs.rechnungnr = this.getNodeParameter('rechnungNr', i) as string;
					} else if (operation === 'getByCustomer') {
						qs.kundennr = this.getNodeParameter('rechnungKundenNr', i) as string;
					} else if (operation === 'getByDateRange') {
						qs.von = this.getNodeParameter('rechnungVon', i) as string;
						qs.bis = this.getNodeParameter('rechnungBis', i) as string;
					}
					responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
						method: 'GET',
						url: `${baseUrl}/api/get-invoices`,
						qs,
						headers,
						json: true,
						...tlsOption,
					});

				// ── Offer ──────────────────────────────────────────────────────────────
				} else if (resource === 'offer') {
					if (operation === 'create') {
						const offerArtId = this.getNodeParameter('offerArtId', i) as number;
						const offerArtNr = this.getNodeParameter('offerArtNr', i) as string;
						const offerBody: Record<string, unknown> = {
							customerid: this.getNodeParameter('offerCustId', i),
							menge: this.getNodeParameter('amount', i),
						};
						if (offerArtId && offerArtId !== 0) {
							offerBody.articleid = offerArtId;
						} else if (offerArtNr) {
							offerBody.artikelnr = offerArtNr;
						}
						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'POST',
							url: `${baseUrl}/api/create-offer`,
							body: offerBody,
							headers,
							json: true,
							...tlsOption,
						});
					} else {
						const qs: Record<string, string> = {};
						if (operation === 'getById') {
							qs.angebotsnr = this.getNodeParameter('angebotNr', i) as string;
						} else if (operation === 'getByCustomer') {
							qs.kundennr = this.getNodeParameter('offerKundenNr', i) as string;
						} else if (operation === 'getByDateRange') {
							qs.von = this.getNodeParameter('offerVon', i) as string;
							qs.bis = this.getNodeParameter('offerBis', i) as string;
						}
						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'GET',
							url: `${baseUrl}/api/get-offers`,
							qs,
							headers,
							json: true,
							...tlsOption,
						});
					}

				// ── Statistics ────────────────────────────────────────────────────────
				} else if (resource === 'statistics') {
					const statisticId = this.getNodeParameter('statisticId', i) as string;
					const parameters: Record<string, string | number> = {};

					const datumVon = this.getNodeParameter('statDatumVon', i) as string;
					if (datumVon) parameters['DatumVon'] = datumVon.substring(0, 10);
					const datumBis = this.getNodeParameter('statDatumBis', i) as string;
					if (datumBis) parameters['DatumBis'] = datumBis.substring(0, 10);
					const vergleichVon = this.getNodeParameter('statVergleichVon', i) as string;
					if (vergleichVon) parameters['VergleichVon'] = vergleichVon.substring(0, 10);
					const vergleichBis = this.getNodeParameter('statVergleichBis', i) as string;
					if (vergleichBis) parameters['VergleichBis'] = vergleichBis.substring(0, 10);

					const weitereParameter = this.getNodeParameter('statWeitereParameter', i) as Record<string, string | number>;
					for (const [key, value] of Object.entries(weitereParameter)) {
						if (value === '' || value === null || value === undefined) continue;
						if (typeof value === 'number' && value === 0) continue;
						parameters[key] = value;
					}

					responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
						method: 'POST',
						url: `${baseUrl}/api/statistics/execute`,
						body: { statisticId, parameters },
						headers,
						json: true,
						...tlsOption,
						timeout: 120000,
					});

				// ── Workflow ───────────────────────────────────────────────────────────
				} else if (resource === 'workflow') {
					if (operation === 'getAll') {
						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'GET',
							url: `${baseUrl}/api/get-workflows`,
							headers,
							json: true,
							...tlsOption,
						});
					} else {
						const workflowId = this.getNodeParameter('workflowId', i) as string;
						const strict = this.getNodeParameter('workflowStrict', i) as boolean;
						const variableCollection = this.getNodeParameter('workflowVariables', i) as {
							variable?: Array<{ name: string; value: string }>;
						};

						const variablen: Record<string, string> = {};
						for (const entry of variableCollection.variable ?? []) {
							if (!entry.name) continue;
							variablen[entry.name] = entry.value ?? '';
						}

						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'POST',
							url: `${baseUrl}/api/execute-workflow`,
							body: { workflowid: workflowId, variablen, strikt: strict },
							headers,
							json: true,
							...tlsOption,
						});
					}

				// ── Acquisition ────────────────────────────────────────────────────────
				} else if (resource === 'akquise') {
					if (operation === 'create') {
						const additionalFields = this.getNodeParameter('additionalFields', i) as Record<
							string,
							string
						>;
						const akquiseBody: Record<string, unknown> = {
							email: this.getNodeParameter('email', i),
							firma: this.getNodeParameter('company', i),
						};
						if (additionalFields.vorname) akquiseBody.vorname = additionalFields.vorname;
						if (additionalFields.nachname) akquiseBody.nachname = additionalFields.nachname;
						if (additionalFields.telefon) akquiseBody.telefon = additionalFields.telefon;
						if (additionalFields.strasse) akquiseBody.strasse = additionalFields.strasse;
						if (additionalFields.plz) akquiseBody.plz = additionalFields.plz;
						if (additionalFields.ort) akquiseBody.ort = additionalFields.ort;
						if (additionalFields.land) akquiseBody.land = additionalFields.land;
						if (additionalFields.leadquelle) akquiseBody.leadquelle = additionalFields.leadquelle;
						if (additionalFields.kampagneninfo)
							akquiseBody.kampagneninfo = additionalFields.kampagneninfo;
						if (additionalFields.perspectiveLeadId)
							akquiseBody.perspectiveLeadId = additionalFields.perspectiveLeadId;

						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'POST',
							url: `${baseUrl}/api/akquise-create`,
							body: akquiseBody,
							headers,
							json: true,
							...tlsOption,
						});
					} else {
						const qs: Record<string, string> = {};
						if (operation === 'getById') {
							qs.kontaktnr = this.getNodeParameter('akquiseId', i) as string;
						} else if (operation === 'getByName') {
							qs.name = this.getNodeParameter('akquiseName', i) as string;
						} else if (operation === 'getByDateRange') {
							qs.von = this.getNodeParameter('akquiseVon', i) as string;
							qs.bis = this.getNodeParameter('akquiseBis', i) as string;
						}
						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'GET',
							url: `${baseUrl}/api/get-akquise`,
							qs,
							headers,
							json: true,
							...tlsOption,
						});
					}

				// ── Document Sync ───────────────────────────────────────────────────────
				} else if (resource === 'documentSync') {
					if (operation === 'checkNew') {
						const checkBody: Record<string, unknown> = {};
						const limit = this.getNodeParameter('docSyncLimit', i) as number;
						if (limit && limit > 0) checkBody.limit = limit;
						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'POST',
							url: `${baseUrl}/api/check-new-documents`,
							body: checkBody,
							headers,
							json: true,
							...tlsOption,
						});

					} else if (operation === 'claimAndDownload') {
						const binaryPropertyName = this.getNodeParameter('docSyncBinaryProperty', i, 'data') as string;
						const unpackMail = this.getNodeParameter('docSyncUnpackMail', i, false) as boolean;

						// 1) Claim a batch — the service only returns relevant (pending) entries.
						const claimBody: Record<string, unknown> = {};
						const claimLimit = this.getNodeParameter('docSyncLimit', i) as number;
						if (claimLimit && claimLimit > 0) claimBody.limit = claimLimit;

						let claim: {
							documents?: Array<Record<string, unknown>>;
							skipped?: Array<Record<string, unknown>>;
						};
						try {
							claim = (await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
								method: 'POST',
								url: `${baseUrl}/api/check-new-documents`,
								body: claimBody,
								headers,
								json: true,
								...tlsOption,
							})) as typeof claim;
						} catch (claimError) {
							// A transient DB/connection hiccup on the service must not abort the
							// whole run — surface it as a single failed item and move on, the
							// same resilience the per-document download loop below already has.
							const err = claimError as { httpCode?: string | number; message?: string };
							returnData.push({
								json: {
									success: false,
									description: 'Claiming new documents failed',
									claimError: err.message ?? String(claimError),
									httpCode: err.httpCode,
								},
								pairedItem: { item: i },
							});
							continue;
						}

						const documents = Array.isArray(claim.documents) ? claim.documents : [];
						const skipped = Array.isArray(claim.skipped) ? claim.skipped : [];
						const count = documents.length;

						// 2) Surface server-side skips (e.g. file_not_found) as their own items so
						// they are NOT mistaken for an empty queue. Each skip carries skipReason and
						// dateiname (the resolved path where the service expected the file).
						for (let s = 0; s < skipped.length; s++) {
							const skip = skipped[s];
							returnData.push({
								json: {
									success: false,
									skipped: true,
									count,
									description: `Document skipped: ${skip.skipReason ?? 'unknown'}`,
									...skip,
								},
								pairedItem: { item: i },
							});
						}

						// 3) Nothing claimed AND nothing skipped → the trigger queue is truly empty.
						// (If items were skipped they were already emitted above.)
						if (count === 0) {
							if (skipped.length === 0) {
								returnData.push({
									json: { success: false, count: 0, description: 'No new documents found' },
									pairedItem: { item: i },
								});
							}
							continue;
						}

						// 4) Download the file for each claimed document.
						for (let d = 0; d < documents.length; d++) {
							const doc = documents[d];
							const docSyncId = doc.syncId as number;
							// The service exposes a downloadUrl only for fetchable items (CREATE).
							// DELETE items carry a sharePointUrl instead and have no file to download.
							const hasFile = typeof doc.downloadUrl === 'string';

							if (!hasFile) {
								// e.g. a DELETE event — no file to fetch, pass metadata through
								returnData.push({
									json: { success: true, count, index: d, ...doc },
									pairedItem: { item: i },
								});
								continue;
							}

							try {
								const fileQs: Record<string, string | number> = { syncId: docSyncId };
								if (unpackMail) fileQs.unpack = 'true';
								const fileResponse = (await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
									method: 'GET',
									url: `${baseUrl}/api/document-file`,
									qs: fileQs,
									headers,
									encoding: 'arraybuffer',
									returnFullResponse: true,
									...tlsOption,
								})) as { body: unknown; headers: Record<string, string> };

								// Unpacked .msg/.eml come back as JSON instead of a binary file.
								const ct = (fileResponse.headers['content-type'] ?? '').toLowerCase();
								if (unpackMail && ct.includes('application/json')) {
									const parsed = JSON.parse((fileResponse.body as Buffer).toString('utf8'));
									returnData.push({
										json: { success: true, count, index: d, ...doc, ...parsed },
										pairedItem: { item: i },
									});
									continue;
								}

								const { fileName, mimeType } = parseDownloadedFileMeta(
									fileResponse.headers,
									(doc.dateiname as string)?.split(/[\\/]/).pop() || `document-${docSyncId}`,
								);
								const binaryData = await this.helpers.prepareBinaryData(
									fileResponse.body as Parameters<typeof this.helpers.prepareBinaryData>[0],
									fileName,
									mimeType,
								);

								returnData.push({
									json: { success: true, count, index: d, ...doc, fileName, mimeType },
									binary: { [binaryPropertyName]: binaryData },
									pairedItem: { item: i },
								});
							} catch (downloadError) {
								// A file can vanish or be skipped server-side between claim and download
								// (404/409/403). Do not abort the whole batch — record and continue.
								const err = downloadError as { httpCode?: string | number; message?: string };
								returnData.push({
									json: {
										success: true,
										count,
										index: d,
										...doc,
										downloadError: err.message ?? String(downloadError),
										httpCode: err.httpCode,
									},
									pairedItem: { item: i },
								});
							}
						}
						continue;

					} else if (operation === 'downloadFile') {
						const syncId = this.getNodeParameter('docSyncId', i) as string;
						const binaryPropertyName = this.getNodeParameter('docSyncBinaryProperty', i) as string;
						const unpackMail = this.getNodeParameter('docSyncUnpackMail', i, false) as boolean;

						const qs: Record<string, string> = { syncId };
						if (unpackMail) qs.unpack = 'true';

						const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'GET',
							url: `${baseUrl}/api/document-file`,
							qs,
							headers,
							encoding: 'arraybuffer',
							returnFullResponse: true,
							...tlsOption,
						})) as { body: unknown; headers: Record<string, string> };

						// When unpacked, the service answers with JSON (meta/body/attachments)
						// instead of a binary file; other formats come back as files as usual.
						const contentType = (response.headers['content-type'] ?? '').toLowerCase();
						if (unpackMail && contentType.includes('application/json')) {
							const parsed = JSON.parse((response.body as Buffer).toString('utf8'));
							returnData.push({
								json: { syncId, ...parsed },
								pairedItem: { item: i },
							});
							continue;
						}

						const { fileName, mimeType } = parseDownloadedFileMeta(
							response.headers,
							`document-${syncId}`,
						);
						const binaryData = await this.helpers.prepareBinaryData(
							response.body as Parameters<typeof this.helpers.prepareBinaryData>[0],
							fileName,
							mimeType,
						);

						returnData.push({
							json: { syncId, fileName, mimeType },
							binary: { [binaryPropertyName]: binaryData },
							pairedItem: { item: i },
						});
						continue;

					} else if (operation === 'transferStatus') {
						const syncId = this.getNodeParameter('docSyncId', i) as string;
						// "Success" is a string field so the value can be passed in from an
						// upstream step (e.g. {{ $json.success }}); coerce it to a real boolean.
						const successRaw = this.getNodeParameter('docSyncSuccess', i) as unknown;
						const success =
							successRaw === true ||
							successRaw === 1 ||
							(typeof successRaw === 'string' &&
								['true', '1', 'yes', 'success'].includes(successRaw.trim().toLowerCase()));
						const transferBody: Record<string, unknown> = { syncId, success };
						if (success) {
							// Build the flat payload object from the key/value collection.
							const payloadParam = this.getNodeParameter('docSyncPayloadFields', i, {}) as {
								field?: Array<{ key?: string; value?: string }>;
							};
							const payloadRows = payloadParam.field ?? [];
							const payloadObj: Record<string, string> = {};
							for (const row of payloadRows) {
								const key = (row.key ?? '').trim();
								if (!key) {
									throw new NodeOperationError(this.getNode(), 'Payload field key must not be empty', { itemIndex: i });
								}
								if (Object.prototype.hasOwnProperty.call(payloadObj, key)) {
									throw new NodeOperationError(this.getNode(), `Duplicate payload key: "${key}"`, { itemIndex: i });
								}
								payloadObj[key] = row.value ?? '';
							}
							if (Object.keys(payloadObj).length > 0) {
								if (JSON.stringify(payloadObj).length > 8192) {
									throw new NodeOperationError(this.getNode(), 'Payload exceeds the 8192 byte limit', { itemIndex: i });
								}
								transferBody.payload = payloadObj;
							}
						} else {
							const transferError = this.getNodeParameter('docSyncError', i, '') as string;
							if (transferError) transferBody.errorMessage = transferError;
						}
						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'POST',
							url: `${baseUrl}/api/sharepoint-transfer-status`,
							body: transferBody,
							headers,
							json: true,
							...tlsOption,
						});

					} else if (operation === 'createNew') {
						const emailFields = this.getNodeParameter('createDokumentEmailFields', i, {}) as Record<string, string>;
						const emailAn = this.getNodeParameter('createDokumentEmailAn', i, '') as string;
						const email: Record<string, unknown> = {};
						if (emailAn) email.an = emailAn;
						if (emailFields.von) email.von = emailFields.von;
						if (emailFields.betreff) email.betreff = emailFields.betreff;
						if (emailFields.datum) email.datum = emailFields.datum;
						if (emailFields.messageId) email.messageId = emailFields.messageId;
						if (emailFields.text) email.text = emailFields.text;
						if (emailFields.html) email.html = emailFields.html;

						const attachments: Array<Record<string, unknown>> = [];
						const attachAllBinaries = this.getNodeParameter('createDokumentAttachAllBinaries', i, false) as boolean;
						if (attachAllBinaries) {
							const itemBinary = items[i].binary ?? {};
							for (const propName of Object.keys(itemBinary)) {
								const binaryMeta = itemBinary[propName];
								const buffer = await this.helpers.getBinaryDataBuffer(i, propName);
								attachments.push({
									inhaltBase64: buffer.toString('base64'),
									dateiname: binaryMeta.fileName || `${propName}.bin`,
									mimeType: binaryMeta.mimeType || 'application/octet-stream',
								});
							}
						} else {
							const attachmentsInput = this.getNodeParameter('createDokumentAttachments', i, {}) as {
								attachment?: Array<{
									binaryProperty?: string;
									dateiname?: string;
									mimeType?: string;
									inhaltBase64?: string;
								}>;
							};
							for (const att of attachmentsInput.attachment ?? []) {
								const entry: Record<string, unknown> = {};
								if (att.binaryProperty) {
									const binaryMeta = this.helpers.assertBinaryData(i, att.binaryProperty);
									const buffer = await this.helpers.getBinaryDataBuffer(i, att.binaryProperty);
									entry.inhaltBase64 = buffer.toString('base64');
									entry.dateiname = att.dateiname || binaryMeta.fileName || 'attachment.bin';
									entry.mimeType = att.mimeType || binaryMeta.mimeType || 'application/octet-stream';
								} else {
									if (!att.inhaltBase64) {
										throw new NodeOperationError(
											this.getNode(),
											'Each attachment requires either an Input Binary Field or Base64 content.',
											{ itemIndex: i },
										);
									}
									entry.inhaltBase64 = att.inhaltBase64;
									if (att.dateiname) entry.dateiname = att.dateiname;
									if (att.mimeType) entry.mimeType = att.mimeType;
								}
								attachments.push(entry);
							}
						}

						const createBody: Record<string, unknown> = {
							bereich: this.getNodeParameter('createDokumentBereich', i),
							belegnummer: this.getNodeParameter('createDokumentBelegnummer', i),
							allowDuplicates: this.getNodeParameter('createDokumentAllowDuplicates', i, false),
							suppressLoopGuard: this.getNodeParameter('createDokumentSuppressLoopGuard', i, false),
						};
						// sharePointUrl is optional now — only send it when provided.
						const createSharePointUrl = (this.getNodeParameter('createDokumentSharePointUrl', i, '') as string).trim();
						if (createSharePointUrl) createBody.sharePointUrl = createSharePointUrl;
						if (Object.keys(email).length > 0) createBody.email = email;
						if (attachments.length > 0) createBody.attachments = attachments;

						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'POST',
							url: `${baseUrl}/api/create-new-dokument`,
							body: createBody,
							headers,
							json: true,
							...tlsOption,
						});

					} else if (operation === 'unpackMsg') {
						const unpackBody: Record<string, unknown> = {
							dateiname: this.getNodeParameter('unpackMsgDateiname', i),
							includeContent: this.getNodeParameter('unpackMsgIncludeContent', i, true),
						};
						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'POST',
							url: `${baseUrl}/api/unpack-msg`,
							body: unpackBody,
							headers,
							json: true,
							...tlsOption,
						});
					}

				// ── DMS ────────────────────────────────────────────────────────────────────
				} else if (resource === 'dms') {
					if (operation === 'createFile') {
						const dmsData = this.getNodeParameter('dmsData', i) as string;
						const binaryPropertyName = this.getNodeParameter('dmsBinaryProperty', i) as string;
						const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
						const fileBase64 = (await this.helpers.getBinaryDataBuffer(i, binaryPropertyName)).toString('base64');
						responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'POST',
							url: `${baseUrl}/api/create-dms-file`,
							body: {
								data: JSON.parse(dmsData),
								file: fileBase64,
								fileName: binaryData.fileName,
								mimeType: binaryData.mimeType,
							},
							headers,
							json: true,
							...tlsOption,
						});
					}
				}

				const executionData = this.helpers.returnJsonArray(responseData);
				returnData.push(...executionData.map((item) => ({ ...item, pairedItem: { item: i } })));
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject);
			}
		}
		return [returnData];
	}
}
