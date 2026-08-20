/**
 * Local ESLint rule: comments in source files must be written in English.
 *
 * The n8n community node review rejects packages that contain non-English
 * inline comments, so this rule turns that requirement into a lint failure
 * instead of a review finding. Detection is a heuristic aimed at German:
 * umlauts/eszett anywhere in a comment, or a common German function word.
 *
 * Run via `npm run lint:comments` (see eslint.comments.config.mjs).
 */

const GERMAN_WORDS = new Set([
	'aber', 'alle', 'allen', 'auch', 'aus', 'beim', 'bereits', 'damit', 'dann', 'dass', 'dem',
	'den', 'der', 'des', 'diese', 'diesem', 'diesen', 'dieser', 'dieses', 'durch', 'eine',
	'einem', 'einen', 'einer', 'eines', 'falls', 'immer', 'jede', 'jeden', 'jeder', 'kein',
	'keine', 'keinen', 'muss', 'nicht', 'noch', 'nur', 'ohne', 'oder', 'schon', 'sein', 'sich',
	'sind', 'soll', 'sollen', 'sonst', 'und', 'vom', 'von', 'wenn', 'werden', 'wird', 'zum', 'zur',
]);

const NON_ASCII_LETTER = /[À-ɏ]/;
const NON_ASCII_TOKEN = /\S*[À-ɏ]\S*/;
const DIRECTIVE = /^\s*(?:eslint|prettier|ts-|@ts-|globals?|exported|jshint|istanbul|c8|v8|#)/;

/** Strip parts that legitimately contain foreign words: URLs, code identifiers, quoted API strings. */
function stripNoise(text) {
	return text
		.replace(/https?:\/\/\S+/g, ' ')
		.replace(/`[^`]*`/g, ' ')
		.replace(/'[^']*'/g, ' ')
		.replace(/"[^"]*"/g, ' ')
		.replace(/\b[A-Za-z]+[._][A-Za-z0-9._]+\b/g, ' ')
		.replace(/\b[a-z]+[A-Z][A-Za-z0-9]*\b/g, ' ');
}

/** @type {import('eslint').Rule.RuleModule} */
const rule = {
	meta: {
		type: 'problem',
		docs: { description: 'Require all comments to be written in English.' },
		schema: [],
		messages: {
			nonEnglish: 'Comments must be written in English (found likely non-English text: "{{snippet}}").',
		},
	},
	create(context) {
		const sourceCode = context.sourceCode ?? context.getSourceCode();

		return {
			Program() {
				for (const comment of sourceCode.getAllComments()) {
					const raw = comment.value;
					if (DIRECTIVE.test(raw)) continue;

					const text = stripNoise(raw);
					let hit = null;

					if (NON_ASCII_LETTER.test(text)) {
						hit = text.match(NON_ASCII_TOKEN)[0];
					} else {
						for (const token of text.split(/[^A-Za-z]+/)) {
							// Acronyms such as MIT or DER are not German words.
							if (token.length > 1 && token === token.toUpperCase()) continue;
							if (GERMAN_WORDS.has(token.toLowerCase())) {
								hit = token;
								break;
							}
						}
					}

					if (!hit) continue;

					context.report({
						loc: comment.loc,
						messageId: 'nonEnglish',
						data: { snippet: raw.trim().slice(0, 60) },
					});
				}
			},
		};
	},
};

export default {
	rules: { 'english-only-comments': rule },
};
