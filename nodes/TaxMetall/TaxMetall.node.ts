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
				eingangsrechnung: 'Purchase Invoice',
				customer: 'Customer',
				dms: 'DMS',
				documentSync: 'Document Sync',
				lieferant: 'Supplier',
				lieferschein: 'Delivery Note',
				mahnung: 'Dunning',
				rechnung: 'Invoice',
				statistics: 'Statistic',
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
					{ name: 'Delivery Note', value: 'lieferschein' },
					// eslint-disable-next-line n8n-nodes-base/node-param-resource-with-plural-option
					{ name: 'DMS', value: 'dms' },
					{ name: 'Document Sync', value: 'documentSync' },
					{ name: 'Dunning', value: 'mahnung' },
					{ name: 'Invoice', value: 'rechnung' },
					{ name: 'Offer', value: 'offer' },
					{ name: 'Order', value: 'auftrag' },
					{ name: 'Purchase Invoice', value: 'eingangsrechnung' },
					{ name: 'Statistic', value: 'statistics' },
					{ name: 'Supplier', value: 'lieferant' },
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
					{ name: 'Search by Date Range', value: 'getByDateRange', action: 'Search by date range in purchase invoice' },
					{ name: 'Search by Purchase Invoice No.', value: 'getById', action: 'Search by purchase invoice number in purchase invoice' },
					{ name: 'Search by Supplier', value: 'getBySupplier', action: 'Search by supplier in purchase invoice' },
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
			{
				displayName: 'Lease Token',
				name: 'docSyncLeaseToken',
				type: 'string',
				typeOptions: { password: true },
				required: true,
				default: '',
				displayOptions: { show: { resource: ['documentSync'], operation: ['downloadFile', 'transferStatus'] } },
				description: 'The leaseToken returned by Check New Documents. It authorizes access to the claimed entry.',
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
				displayName: 'SharePoint URL',
				name: 'docSyncSharePointUrl',
				type: 'string',
				default: '',
				displayOptions: { show: { resource: ['documentSync'], operation: ['transferStatus'] } },
				description: 'URL of the uploaded document in SharePoint (used when Success is true). Stored under Payload.sharePoint.mainUrl. Required for CREATE uploads; leave empty for DELETE acknowledgements.',
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
				required: true,
				default: '',
				displayOptions: { show: { resource: ['documentSync'], operation: ['createNew'] } },
				description: 'Source SharePoint URL of the document. Stored under Payload.sharePoint.mainUrl.',
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

						// 1) Claim a batch — the service only returns relevant (pending) entries
						//    and assigns one batch-wide leaseToken.
						const claimBody: Record<string, unknown> = {};
						const claimLimit = this.getNodeParameter('docSyncLimit', i) as number;
						if (claimLimit && claimLimit > 0) claimBody.limit = claimLimit;
						const claim = (await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'POST',
							url: `${baseUrl}/api/check-new-documents`,
							body: claimBody,
							headers,
							json: true,
							...tlsOption,
						})) as { leaseToken: string; documents?: Array<Record<string, unknown>> };

						const leaseToken = claim.leaseToken;
						const documents = Array.isArray(claim.documents) ? claim.documents : [];
						const count = documents.length;

						// 2) Nothing claimed → emit one summary item so downstream always gets feedback.
						if (count === 0) {
							returnData.push({
								json: { success: false, count: 0, description: 'No new documents found' },
								pairedItem: { item: i },
							});
							continue;
						}

						// 3) Download the file for each claimed document (same batch-wide leaseToken).
						for (let d = 0; d < documents.length; d++) {
							const doc = documents[d];
							const docSyncId = doc.syncId as number;
							// The service exposes a downloadUrl only for fetchable items (CREATE).
							// DELETE items carry a sharePointUrl instead and have no file to download.
							const hasFile = typeof doc.downloadUrl === 'string';

							if (!hasFile) {
								// e.g. a DELETE event — no file to fetch, pass metadata through
								returnData.push({
									json: { success: true, count, index: d, ...doc, leaseToken },
									pairedItem: { item: i },
								});
								continue;
							}

							try {
								const fileResponse = (await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
									method: 'GET',
									url: `${baseUrl}/api/document-file`,
									qs: { syncId: docSyncId, token: leaseToken },
									headers,
									encoding: 'arraybuffer',
									returnFullResponse: true,
									...tlsOption,
								})) as { body: unknown; headers: Record<string, string> };

								const disposition = fileResponse.headers['content-disposition'] ?? '';
								const fileNameMatch = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
								const fileName = fileNameMatch
									? decodeURIComponent(fileNameMatch[1].trim())
									: ((doc.dateiname as string)?.split(/[\\/]/).pop() || `document-${docSyncId}`);
								const mimeType = (fileResponse.headers['content-type'] ?? 'application/octet-stream')
									.split(';')[0]
									.trim();
								const binaryData = await this.helpers.prepareBinaryData(
									fileResponse.body as Parameters<typeof this.helpers.prepareBinaryData>[0],
									fileName,
									mimeType,
								);

								returnData.push({
									json: { success: true, count, index: d, ...doc, leaseToken, fileName, mimeType },
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
										leaseToken,
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
						const leaseToken = this.getNodeParameter('docSyncLeaseToken', i) as string;
						const binaryPropertyName = this.getNodeParameter('docSyncBinaryProperty', i) as string;

						const response = (await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
							method: 'GET',
							url: `${baseUrl}/api/document-file`,
							qs: { syncId, token: leaseToken },
							headers,
							encoding: 'arraybuffer',
							returnFullResponse: true,
							...tlsOption,
						})) as { body: unknown; headers: Record<string, string> };

						const disposition = response.headers['content-disposition'] ?? '';
						const fileNameMatch = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
						const fileName = fileNameMatch ? fileNameMatch[1].trim() : `document-${syncId}`;
						const mimeType = (response.headers['content-type'] ?? 'application/octet-stream')
							.split(';')[0]
							.trim();
						const binaryData = await this.helpers.prepareBinaryData(
							response.body as Parameters<typeof this.helpers.prepareBinaryData>[0],
							fileName,
							mimeType,
						);

						returnData.push({
							json: { syncId, leaseToken, fileName, mimeType },
							binary: { [binaryPropertyName]: binaryData },
							pairedItem: { item: i },
						});
						continue;

					} else if (operation === 'transferStatus') {
						const syncId = this.getNodeParameter('docSyncId', i) as string;
						const leaseToken = this.getNodeParameter('docSyncLeaseToken', i) as string;
						// "Success" is a string field so the value can be passed in from an
						// upstream step (e.g. {{ $json.success }}); coerce it to a real boolean.
						const successRaw = this.getNodeParameter('docSyncSuccess', i) as unknown;
						const success =
							successRaw === true ||
							successRaw === 1 ||
							(typeof successRaw === 'string' &&
								['true', '1', 'yes', 'success'].includes(successRaw.trim().toLowerCase()));
						const transferBody: Record<string, unknown> = { syncId, leaseToken, success };
						if (success) {
							const sharePointUrl = this.getNodeParameter('docSyncSharePointUrl', i, '') as string;
							if (sharePointUrl) transferBody.sharePointUrl = sharePointUrl;
						} else {
							const transferError = this.getNodeParameter('docSyncError', i, '') as string;
							if (transferError) transferBody.error = transferError;
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
							sharePointUrl: this.getNodeParameter('createDokumentSharePointUrl', i),
							allowDuplicates: this.getNodeParameter('createDokumentAllowDuplicates', i, false),
						};
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
