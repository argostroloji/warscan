import os
import re

file_path = 'src/app/data-loader.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Clean happyAllItems
text = re.sub(r'    \/\/ Reset happy variant accumulator for fresh pipeline run\n    if \(SITE_VARIANT === \'happy\'\) \{\n      this\.ctx\.happyAllItems = \[\];\n    \}\n', '', text)
text = re.sub(r'        \/\/ Tag items with content categories for happy variant\n        if \(SITE_VARIANT === \'happy\'\) \{\n          for \(const item of items\) \{\n            item\.happyCategory = classifyNewsItem\(item\.source, item\.title\);\n          \}\n          \/\/ Accumulate curated items for the positive news pipeline\n          this\.ctx\.happyAllItems = this\.ctx\.happyAllItems\.concat\(items\);\n        \}\n', '', text)

# 2. Clean imports
text = re.sub(r'  HeatmapPanel,\n', '', text)
text = re.sub(r'  CommoditiesPanel,\n', '', text)
text = re.sub(r'  CryptoPanel,\n', '', text)
text = re.sub(r'  EconomicPanel,\n', '', text)
text = re.sub(r'  TechReadinessPanel,\n', '', text)
text = re.sub(r'  TradePolicyPanel,\n', '', text)
text = re.sub(r'  SupplyChainPanel,\n', '', text)
text = re.sub(r"import \{ classifyNewsItem \} from '@/services/positive-classifier';\n", '', text)
text = re.sub(r"import \{ fetchGivingSummary \} from '@/services/giving';\n", '', text)
text = re.sub(r"import \{ GivingPanel \} from '@/components';\n", '', text)
text = re.sub(r"import \{ fetchProgressData \} from '@/services/progress-data';\n", '', text)
text = re.sub(r"import \{ fetchConservationWins \} from '@/services/conservation-data';\n", '', text)
text = re.sub(r"import \{ fetchRenewableEnergyData, fetchEnergyCapacity \} from '@/services/renewable-energy-data';\n", '', text)
text = re.sub(r"import \{ checkMilestones \} from '@/services/celebration';\n", '', text)
text = re.sub(r"import \{ fetchHappinessScores \} from '@/services/happiness-data';\n", '', text)
text = re.sub(r"import \{ fetchRenewableInstallations \} from '@/services/renewable-installations';\n", '', text)
text = re.sub(r"import \{ filterBySentiment \} from '@/services/sentiment-gate';\n", '', text)
text = re.sub(r"import \{ fetchAllPositiveTopicIntelligence \} from '@/services/gdelt-intel';\n", '', text)
text = re.sub(r"import \{ fetchPositiveGeoEvents, geocodePositiveNewsItems \} from '@/services/positive-events-geo';\n", '', text)
text = re.sub(r"import \{ fetchKindnessData \} from '@/services/kindness-data';\n", '', text)

# 3. Clean up the PizzInt / panels usages that throw Cannot find name 'EconomicPanel' etc.
text = re.sub(r"\(this\.ctx\.panels\[\'economic\'\] as EconomicPanel\)", "(this.ctx.panels['economic'] as any)", text)
text = re.sub(r"\(this\.ctx\.panels\[\'trade-policy\'\] as TradePolicyPanel\)", "(this.ctx.panels['trade-policy'] as any)", text)
text = re.sub(r"\(this\.ctx\.panels\[\'supply-chain\'\] as SupplyChainPanel\)", "(this.ctx.panels['supply-chain'] as any)", text)
text = re.sub(r"\(this\.ctx\.panels\[\'heatmap\'\] as HeatmapPanel\)", "(this.ctx.panels['heatmap'] as any)", text)
text = re.sub(r"\(this\.ctx\.panels\[\'commodities\'\] as CommoditiesPanel\)", "(this.ctx.panels['commodities'] as any)", text)
text = re.sub(r"\(this\.ctx\.panels\[\'crypto\'\] as CryptoPanel\)", "(this.ctx.panels['crypto'] as any)", text)

# And PizzIntIndicator properties which trigger 'pizzintIndicator' does not exist on type 'AppContext'
text = re.sub(r"this\.ctx\.pizzintIndicator\?", "((this.ctx as any).pizzintIndicator)?", text)
text = re.sub(r"this\.ctx\.breakthroughsPanel\?", "((this.ctx as any).breakthroughsPanel)?", text)
text = re.sub(r"this\.ctx\.heroPanel\?", "((this.ctx as any).heroPanel)?", text)
text = re.sub(r"this\.ctx\.digestPanel\?", "((this.ctx as any).digestPanel)?", text)
text = re.sub(r"this\.ctx\.positivePanel\?", "((this.ctx as any).positivePanel)?", text)
text = re.sub(r"this\.ctx\.happyAllItems", "(this.ctx as any).happyAllItems", text)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print('Phase 2 cleanup complete')
