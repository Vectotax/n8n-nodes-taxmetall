import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionTypes,
} from 'n8n-workflow';

export class TaxMetall implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TaxMetall',
		name: 'taxMetall',
		icon: 'file:VectotaxLogo.svg',
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
				lieferant: 'Supplier',
				lieferschein: 'Delivery Note',
				mahnung: 'Dunning',
				rechnung: 'Invoice',
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
			}[$parameter["operation"]] ?? $parameter["operation"])
		}}`,
		defaults: {
			name: 'TaxMetall',
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
					{ name: 'Dunning', value: 'mahnung' },
					{ name: 'Invoice', value: 'rechnung' },
					{ name: 'Offer', value: 'offer' },
					{ name: 'Order', value: 'auftrag' },
					{ name: 'Purchase Invoice', value: 'eingangsrechnung' },
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
				options: [{ name: 'Create', value: 'create', action: 'Create an acquisition' }],
				default: 'create',
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
				displayOptions: { show: { resource: ['akquise'] } },
				default: '',
			},
			{
				displayName: 'Company',
				name: 'company',
				type: 'string',
				required: true,
				displayOptions: { show: { resource: ['akquise'] } },
				default: '',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add field',
				default: {},
				displayOptions: { show: { resource: ['akquise'] } },
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
		],
		usableAsTool: true,
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

				const headers = {
					'tax-api-key': credentials.apiKey as string,
					'ngrok-skip-browser-warning': 'true',
					'Content-Type': 'application/json',
				};

				const baseUrl = credentials.baseUrl as string;

				// ── Article ────────────────────────────────────────────────────────────
				if (resource === 'article') {
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
					responseData = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/get-articles`,
						qs,
						headers,
						json: true,
						skipSslCertificateValidation: true,
					});

				// ── Order ──────────────────────────────────────────────────────────────
				} else if (resource === 'auftrag') {
					const qs: Record<string, string> = {};
					if (operation === 'getStatus') {
						qs.auftragnr = this.getNodeParameter('auftragsNr', i) as string;
					} else if (operation === 'getByDateRange') {
						qs.von = this.getNodeParameter('auftragVon', i) as string;
						qs.bis = this.getNodeParameter('auftragBis', i) as string;
					}
					responseData = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/get-orders`,
						qs,
						headers,
						json: true,
						skipSslCertificateValidation: true,
					});

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
					responseData = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/get-purchase-invoices`,
						qs,
						headers,
						json: true,
						skipSslCertificateValidation: true,
					});

				// ── Customer ───────────────────────────────────────────────────────────
				} else if (resource === 'customer') {
					const qs: Record<string, string> = {};
					if (operation === 'getByName') {
						qs.name = this.getNodeParameter('customerName', i) as string;
					} else if (operation === 'getById') {
						qs.kundennr = this.getNodeParameter('customerId', i) as string;
					} else if (operation === 'getByOrderId') {
						qs.auftragnr = this.getNodeParameter('orderId', i) as string;
					}
					responseData = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/get-customers`,
						qs,
						headers,
						json: true,
						skipSslCertificateValidation: true,
					});

				// ── Supplier ───────────────────────────────────────────────────────────
				} else if (resource === 'lieferant') {
					const qs: Record<string, string> = {};
					if (operation === 'getById') {
						qs.liefernr = this.getNodeParameter('lieferantId', i) as string;
					} else if (operation === 'getByName') {
						qs.name = this.getNodeParameter('lieferantName', i) as string;
					} else if (operation === 'getByArticle') {
						qs.artikelnr = this.getNodeParameter('lieferantArtikelNr', i) as string;
					}
					responseData = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/get-suppliers`,
						qs,
						headers,
						json: true,
						skipSslCertificateValidation: true,
					});

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
					responseData = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/get-delivery-notes`,
						qs,
						headers,
						json: true,
						skipSslCertificateValidation: true,
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
					responseData = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/get-dunning`,
						qs,
						headers,
						json: true,
						skipSslCertificateValidation: true,
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
					responseData = await this.helpers.httpRequest({
						method: 'GET',
						url: `${baseUrl}/api/get-invoices`,
						qs,
						headers,
						json: true,
						skipSslCertificateValidation: true,
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
						responseData = await this.helpers.httpRequest({
							method: 'POST',
							url: `${baseUrl}/api/create-offer`,
							body: offerBody,
							headers,
							json: true,
							skipSslCertificateValidation: true,
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
						responseData = await this.helpers.httpRequest({
							method: 'GET',
							url: `${baseUrl}/api/get-offers`,
							qs,
							headers,
							json: true,
							skipSslCertificateValidation: true,
						});
					}

				// ── Acquisition ────────────────────────────────────────────────────────
				} else if (resource === 'akquise') {
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

					responseData = await this.helpers.httpRequest({
						method: 'POST',
						url: `${baseUrl}/api/akquise-create`,
						body: akquiseBody,
						headers,
						json: true,
						skipSslCertificateValidation: true,
					});
				}

				const executionData = this.helpers.returnJsonArray(responseData);
				returnData.push(...executionData.map((item) => ({ ...item, pairedItem: { item: i } })));
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}
				throw error;
			}
		}
		return [returnData];
	}
}
