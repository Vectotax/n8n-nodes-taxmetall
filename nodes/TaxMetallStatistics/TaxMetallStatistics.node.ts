import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
	NodeConnectionTypes,
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

export class TaxMetallStatistics implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'TaxMetall: Execute Statistics',
		name: 'taxMetallStatistics',
		icon: 'file:VectotaxLogo.svg',
		group: ['transform'],
		version: 1,
		description:
			'Executes a statistics or report query in the TaxMetall ERP system and returns the results as JSON.',
		subtitle: 'Load statistics',
		defaults: { name: 'TaxMetall: Statistics' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'taxMetallApi',
				required: true,
			},
		],
		properties: [
			// ─── Statistics selection ────────────────────────────────────────────────
			{
				displayName: 'Statistics / Report Name or ID',
				name: 'statisticId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getStatistics',
				},
				default: '',
				required: true,
				noDataExpression: true,
				description: 'Select the report to execute. The option description indicates which parameters it requires. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},

			// ─── Main date range ─────────────────────────────────────────────────────
			{
				displayName: 'Date From',
				name: 'datumVon',
				type: 'dateTime',
				default: '',
				description: 'Start date of the reporting period (SQL parameter: DatumVon / %Av)',
			},
			{
				displayName: 'Date To',
				name: 'datumBis',
				type: 'dateTime',
				default: '',
				description: 'End date of the reporting period (SQL parameter: DatumBis / %Ab)',
			},

			// ─── Comparison period ───────────────────────────────────────────────────
			{
				displayName: 'Comparison From',
				name: 'vergleichVon',
				type: 'dateTime',
				default: '',
				description: 'Start date of a comparison period (SQL parameter: VergleichVon / %Vgv)',
			},
			{
				displayName: 'Comparison To',
				name: 'vergleichBis',
				type: 'dateTime',
				default: '',
				description: 'End date of a comparison period (SQL parameter: VergleichBis / %Vgb)',
			},

			// ─── Additional optional parameters ──────────────────────────────────────
			{
				displayName: 'Additional Parameters',
				name: 'weitereParameter',
				type: 'collection',
				placeholder: 'Add parameter',
				default: {},
				description: 'Optional filter parameters — which ones the selected report requires is shown in its description above',
				options: [
					{
						displayName: 'Article Group',
						name: 'ArtikelGruppe',
						type: 'string',
						default: '',
						description: 'Article group (SQL parameter: ArtikelGruppe / %Ag)',
					},
					{
						displayName: 'Article No.',
						name: 'Artikel',
						type: 'string',
						default: '',
						description: 'Article number (SQL parameter: Artikel / %Ar)',
					},
					{
						displayName: 'Business Area',
						name: 'GeschBereich',
						type: 'string',
						default: '',
						description: 'Business area (SQL parameter: GeschBereich / %Gb)',
					},
					{
						displayName: 'Customer No.',
						name: 'Kunden',
						type: 'string',
						default: '',
						description: 'Customer number (SQL parameter: Kunden / %K)',
					},
					{
						displayName: 'Employee',
						name: 'Mitarbeiter',
						type: 'string',
						default: '',
						description: 'Employee abbreviation (SQL parameter: Mitarbeiter / %Mn)',
					},
					{
						displayName: 'Offer No.',
						name: 'Angebot',
						type: 'string',
						default: '',
						description: 'Offer number (SQL parameter: Angebot / %An)',
					},
					{
						displayName: 'Offer Position',
						name: 'AngebotsPos',
						type: 'string',
						default: '',
						description: 'Offer position (SQL parameter: AngebotsPos / %PAn)',
					},
					{
						displayName: 'Order No.',
						name: 'Auftrag',
						type: 'string',
						default: '',
						description: 'Order number (SQL parameter: Auftrag / %Au)',
					},
					{
						displayName: 'Order Position',
						name: 'AuftragsPos',
						type: 'string',
						default: '',
						description: 'Order position (SQL parameter: AuftragsPos / %PAu)',
					},
					{
						displayName: 'Order Type',
						name: 'AuftragsArt',
						type: 'string',
						default: '',
						description: 'Order type abbreviation (SQL parameter: AuftragsArt / %Aa)',
					},
					{
						displayName: 'Project No.',
						name: 'Projekt',
						type: 'string',
						default: '',
						description: 'Project number (SQL parameter: Projekt / %Pn)',
					},
					{
						displayName: 'Purchase Order No.',
						name: 'Bestellung',
						type: 'string',
						default: '',
						description: 'Purchase order number (SQL parameter: Bestellung / %Be)',
					},
					{
						displayName: 'Purchase Order Position',
						name: 'BestellPos',
						type: 'string',
						default: '',
						description: 'Purchase order position (SQL parameter: BestellPos / %PBe)',
					},
					{
						displayName: 'Supplier No.',
						name: 'Lieferanten',
						type: 'string',
						default: '',
						description: 'Supplier number (SQL parameter: Lieferanten / %L)',
					},
					{
						displayName: 'Value Range From',
						name: 'WertebereichVon',
						type: 'number',
						default: 0,
						description: 'Numeric start value for value range filter (SQL parameter: WertebereichVon / %WBV)',
					},
					{
						displayName: 'Value Range To',
						name: 'WertebereichBis',
						type: 'number',
						default: 0,
						description: 'Numeric end value for value range filter (SQL parameter: WertebereichBis / %WBB)',
					},
					{
						displayName: 'Variable 1',
						name: 'Variable1',
						type: 'string',
						default: '',
						description: 'Free text value (SQL parameter: Variable1 / %V1)',
					},
					{
						displayName: 'Warehouse',
						name: 'Lagerort',
						type: 'string',
						default: '',
						description: 'Warehouse abbreviation (SQL parameter: Lagerort / %Lo)',
					},
				],
			},
		],
		usableAsTool: true,
	};

	// ─── Dynamic options ────────────────────────────────────────────────────────
	methods = {
		loadOptions: {
			async getStatistics(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('taxMetallApi');
				const baseUrl = credentials.baseUrl as string;

				let response: StatisticsListResponse;
				try {
					response = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
						method: 'GET',
						url: `${baseUrl}/api/statistics/list`,
						json: true,
						skipSslCertificateValidation: true,
					});
				} catch (error) {
					throw new NodeOperationError(
						this.getNode(),
						`Failed to load statistics list: ${(error as Error).message}`,
					);
				}

				if (!response.success || !Array.isArray(response.statistics)) {
					return [];
				}

				return response.statistics.map((stat) => ({
					name: stat.name,
					value: stat.id,
					description:
						stat.parameters.length > 0
							? `Required parameters: ${stat.parameters.join(', ')}`
							: 'No parameters required',
				}));
			},
		},
	};

	// ─── Execution ──────────────────────────────────────────────────────────────
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('taxMetallApi');
		const baseUrl = credentials.baseUrl as string;

		const headers = {
			'Content-Type': 'application/json',
		};

		for (let i = 0; i < items.length; i++) {
			try {
				const statisticId = this.getNodeParameter('statisticId', i) as string;

				// Build parameter object — only non-empty values are sent
				const parameters: Record<string, string | number> = {};

				// Date parameters: n8n provides ISO-8601 ("2024-01-01T00:00:00.000Z") → "YYYY-MM-DD"
				const datumVon = this.getNodeParameter('datumVon', i) as string;
				if (datumVon) parameters['DatumVon'] = datumVon.substring(0, 10);

				const datumBis = this.getNodeParameter('datumBis', i) as string;
				if (datumBis) parameters['DatumBis'] = datumBis.substring(0, 10);

				const vergleichVon = this.getNodeParameter('vergleichVon', i) as string;
				if (vergleichVon) parameters['VergleichVon'] = vergleichVon.substring(0, 10);

				const vergleichBis = this.getNodeParameter('vergleichBis', i) as string;
				if (vergleichBis) parameters['VergleichBis'] = vergleichBis.substring(0, 10);

				// Additional parameters from collection — skip empty strings and zero numbers
				const weitereParameter = this.getNodeParameter(
					'weitereParameter',
					i,
				) as Record<string, string | number>;

				for (const [key, value] of Object.entries(weitereParameter)) {
					if (value === '' || value === null || value === undefined) continue;
					if (typeof value === 'number' && value === 0) continue;
					parameters[key] = value;
				}

				const responseData = await this.helpers.httpRequestWithAuthentication.call(this, 'taxMetallApi', {
					method: 'POST',
					url: `${baseUrl}/api/statistics/execute`,
					body: { statisticId, parameters },
					headers,
					json: true,
					skipSslCertificateValidation: true,
					timeout: 120000,
				});

				const executionData = this.helpers.returnJsonArray(responseData);
				returnData.push(
					...executionData.map((item) => ({ ...item, pairedItem: { item: i } })),
				);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeApiError(this.getNode(), error as JsonObject);
			}
		}

		return [returnData];
	}
}
