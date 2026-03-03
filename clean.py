import os
import re

filepath = "src/app/data-loader.ts"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

functions = [
    "loadPizzInt",
    "loadFredData",
    "loadOilAnalytics",
    "loadGovernmentSpending",
    "loadBisData",
    "loadTradePolicy",
    "loadSupplyChain",
    "loadPositiveEvents",
    "loadProgressData",
    "loadSpeciesData",
    "loadRenewableData",
]

for fn in functions:
    # Match exactly "  async loadPizzInt(" to the next function definition
    # or EOF. 
    pattern = r"  (?:async )?" + fn + r"\(\)[\s\S]*?(?=\n  (?:async |private |public |protected |load))"
    replacement = f"  async {fn}() {{}}\n"
    if fn == "loadKindnessData":
        pattern = r"  loadKindnessData\(\)[\s\S]*?(?=\n  (?:async |private |public |protected |load))"
        replacement = f"  loadKindnessData() {{}}\n"
    code = re.sub(pattern, replacement, code)

# Fix KindnessData specifically since it wasn't in the list
pattern = r"  loadKindnessData\(\)[\s\S]*?(?=\n  (?:async |private |public |protected |load))"
code = re.sub(pattern, "  loadKindnessData() {}\n", code)

# Clean loadMarkets
pattern = r"  async loadMarkets\(\)[\s\S]*?(?=\n  async loadPredictions\()"
replacement = "  async loadMarkets() { try { const m = await import('@/services'); const res = await m.fetchMultipleStocks([...import('@/config').MARKET_SYMBOLS, ...import('@/config').COMMODITIES]); this.ctx.latestMarkets = res; (this.ctx.panels['markets'] as any)?.setData(res); } catch {} }\n"
code = re.sub(pattern, replacement, code)

# Clean switches
code = re.sub(r"        case 'techEvents':[\s\S]*?break;", "", code)
code = re.sub(r"        case 'positiveEvents':[\s\S]*?break;", "", code)
code = re.sub(r"        case 'kindness':[\s\S]*?break;", "", code)

# Check for happy variants in loadAllData
code = re.sub(r"    // Progress charts data \(happy variant only\)[\s\S]*?(?=    // Global giving activity data)", "", code)
code = re.sub(r"    // Global giving activity data \(all variants\)[\s\S]*?(?=    if \(SITE_VARIANT === 'full'\))", "", code)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("Data loader cleaned using Python.")
