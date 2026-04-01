import {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TaxMetallApi implements ICredentialType {
	name = 'taxMetallApi';
	displayName = 'TaxMetall API';
	documentationUrl = 'https://www.vectotax.de';
	icon = 'file:VectotaxLogo.svg' as const;
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/validate',
			headers: {
				'tax-api-key': '={{$credentials.apiKey}}',
			},
			skipSslCertificateValidation: true,
		},
	};

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Dein API-Key für den Header: tax-api-key',
		},
		{
			displayName: 'Basis URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://my-domain:8443',
			required: true,
			description: 'Die Basis-URL deiner TaxMetall Instanz',
		},
	];
}
