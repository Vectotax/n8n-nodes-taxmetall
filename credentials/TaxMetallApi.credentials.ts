import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class TaxMetallApi implements ICredentialType {
	name = 'taxMetallApi';
	displayName = 'TaxMetall API';
	documentationUrl = 'https://www.vectotax.de';
	icon = 'file:VectotaxLogo.svg' as const;

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'tax-api-key': '={{$credentials.apiKey}}',
			},
		},
	};

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
			description: 'Your API key for the header: tax-api-key',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://my-domain:8443',
			required: true,
			description: 'The base URL of your TaxMetall instance',
		},
		{
			displayName: 'Use ngrok Tunnel',
			name: 'useNgrok',
			type: 'boolean',
			default: false,
			description: 'Whether your TaxMetall instance is accessed via an ngrok tunnel. Enable this if you use ngrok instead of a custom domain.',
		},
	];
}
