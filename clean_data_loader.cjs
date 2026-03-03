const fs = require('fs');
let code = fs.readFileSync('src/app/data-loader.ts', 'utf8');

const functionsToStub = [
    'loadPizzInt',
    'loadFredData',
    'loadOilAnalytics',
    'loadGovernmentSpending',
    'loadBisData',
    'loadTradePolicy',
    'loadSupplyChain',
    'loadPositiveEvents',
    'loadProgressData',
    'loadSpeciesData',
    'loadRenewableData',
];

// Clean function block by looking for exactly "  async functionName(" and stopping at next "  async " or "  private "
for (const fn of functionsToStub) {
    const regex = new RegExp(\`  (?:async )?\${fn}\\\\\\(\\\\\\)[\\\\s\\\\S]*?(?=\\\n  (?:async|private|public|protected|load)[\\s\\w]*\\\\()\`, 'm');
  code = code.replace(regex, \`  async \${fn}() {}\\n\`);
}

// Special case for loadKindnessData since it's not async in the original signature
code = code.replace(/  loadKindnessData\(\)[\s\S]*?(?=\n  (?:async|private|public|protected|load)[\s\w]*\()/, '  loadKindnessData() {}\n');

// Clean up loadMarkets
code = code.replace(/  async loadMarkets\(\)[\s\S]*?(?=\n  async loadPredictions\()/, '  async loadMarkets() { try { const m = await import(\'@/services\'); const res = await m.fetchMultipleStocks([...import(\'@/config\').MARKET_SYMBOLS, ...import(\'@/config\').COMMODITIES]); this.ctx.latestMarkets = res; (this.ctx.panels[\'markets\'] as any)?.setData(res); } catch {} }\n');

// Clean loadDataForLayer switches
code = code.replace(/        case 'techEvents':[\s\S]*?break;/g, '');
code = code.replace(/        case 'positiveEvents':[\s\S]*?break;/g, '');
code = code.replace(/        case 'kindness':[\s\S]*?break;/g, '');

// Clean global giving call
code = code.replace(/\/\/ Global giving activity data \(all variants\)[\s\S]*?(?=    if \(SITE_VARIANT === 'full'\))/g, '');
code = code.replace(/\/\/ Progress charts data \(happy variant only\)[\s\S]*?(?=\/\/ Global giving activity data)/g, '');

fs.writeFileSync('src/app/data-loader.ts', code);
console.log('Safe cleanup applied.');
