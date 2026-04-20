const { mkdirSync, copyFileSync, readdirSync, existsSync } = require('fs');
const { join } = require('path');

const localsFolders = [
	'nodes/TaxMetall/_locals',
	'nodes/TaxMetallStatistics/_locals',
];

for (const src of localsFolders) {
	if (!existsSync(src)) continue;
	const dest = join('dist', src);
	mkdirSync(dest, { recursive: true });
	for (const file of readdirSync(src)) {
		copyFileSync(join(src, file), join(dest, file));
	}
	console.log(`Copied ${src} → ${dest}`);
}
