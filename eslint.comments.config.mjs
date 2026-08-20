/**
 * Separate ESLint config for the comment-language check.
 *
 * It is NOT merged into eslint.config.mjs on purpose: `n8n-node lint` runs in
 * strict mode and rejects any modification of that file. Run this one via
 * `npm run lint:comments`.
 */
import parser from '@typescript-eslint/parser';
import localRules from './eslint-rules/english-only-comments.mjs';

export default [
	{
		files: ['nodes/**/*.ts', 'credentials/**/*.ts'],
		// Inline eslint-disable comments reference rules that only exist in the main
		// config, so inline configuration is switched off for this run.
		linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: 'off' },
		languageOptions: { parser, parserOptions: { ecmaVersion: 'latest', sourceType: 'module' } },
		plugins: { local: localRules },
		rules: { 'local/english-only-comments': 'error' },
	},
];
