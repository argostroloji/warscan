import os
import re

def process_file(filepath):
    if not os.path.exists(filepath):
        return
        
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Generic removals
    content = re.sub(r"import\s+\{[^}]*?\b(EconomicPanel|TechEventsPanel|ServiceStatusPanel|CommoditiesPanel|GulfEconomiesPanel|InvestmentsPanel|TradePolicyPanel|SupplyChainPanel|LiveWebcamsPanel|TechReadinessPanel|HeatmapPanel|CryptoPanel|PositiveNewsFeedPanel|CountersPanel|ProgressChartsPanel|BreakthroughsTickerPanel|HeroSpotlightPanel|GoodThingsDigestPanel|SpeciesComebackPanel|RenewableEnergyPanel|GivingPanel|MobileWarningModal|PizzIntIndicator|PlaybackControl)\b[^}]*\}\s*from\s*'@/components';?", "", content, flags=re.DOTALL)
    
    content = re.sub(r"import\s+type\s+\{[^}]*?\b(PlaybackControl|MobileWarningModal|PizzIntIndicator)\b[^}]*\}\s*from\s*'@/components';?", "", content, flags=re.DOTALL)

    content = re.sub(r"import\s+.*?\b(classifyNewsItem|fetchGivingSummary|fetchProgressData|fetchConservationWins|fetchRenewableEnergyData|checkMilestones|fetchHappinessScores|fetchRenewableInstallations|filterBySentiment|fetchAllPositiveTopicIntelligence|fetchPositiveGeoEvents|fetchKindnessData|fetchPizzIntStatus|fetchFredData|fetchOilAnalytics|fetchBisData|fetchTradeRestrictions|fetchTariffTrends|fetchTradeFlows|fetchTradeBarriers|fetchShippingRates|fetchChokepointStatus|fetchCriticalMinerals)\b.*?;", "", content, flags=re.DOTALL)

    # data-loader fixes
    if "data-loader.ts" in filepath:
        content = re.sub(r"import \{ classifyNewsItem \}.*?from[^;]+;", "", content, flags=re.DOTALL)
        content = re.sub(r"import \{.*?GivingPanel.*?from[^;]+;", "", content, flags=re.DOTALL)
        content = re.sub(r"// Tag items with content categories for happy variant\s*if \(SITE_VARIANT === 'happy'\) \{.*?(?=collectedNews\.push)", "", content, flags=re.DOTALL)
        content = re.sub(r"this\.ctx\.happyAllItems\s*=\s*this\.ctx\.happyAllItems\.concat\(items\);", "", content)
        content = re.sub(r"item\.happyCategory = classifyNewsItem\(.*?\);", "", content)
        content = re.sub(r"this\.ctx\.happyAllItems = \[\];", "", content)
        
    # search-manager fixes
    if "search-manager.ts" in filepath:
        content = re.sub(r"import\s+\{ TECH_HQS, ACCELERATORS \}\s*from\s*'@/config/tech-geo';?", "", content)
        content = re.sub(r"import\s+\{ STOCK_EXCHANGES, FINANCIAL_CENTERS, CENTRAL_BANKS, COMMODITY_HUBS \}\s*from\s*'@/config/finance-geo';?", "", content)
        content = re.sub(r"else if \(SITE_VARIANT === 'tech'\) \{.*?(?=\} else \{)", "", content, flags=re.DOTALL)
        content = re.sub(r"if \(SITE_VARIANT === 'finance'\) \{.*?(?=this\.ctx\.searchModal\.registerSource\('country')", "", content, flags=re.DOTALL)
        content = re.sub(r"(case\s+'techcompany':|case\s+'ailab':|case\s+'startup':|case\s+'techevent':|case\s+'techhq':|case\s+'accelerator':|case\s+'exchange':|case\s+'financialcenter':|case\s+'centralbank':|case\s+'commodityhub':).*?(?=break;\s*case|\})", "break;", content, flags=re.DOTALL)

    # map.ts and config variants
    content = re.sub(r"import\s+\{\s*TECH_HQS.*?\btech-geo';?", "", content, flags=re.DOTALL)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

for root, _, files in os.walk("src"):
    for file in files:
        if file.endswith(".ts") or file.endswith(".tsx"):
            process_file(os.path.join(root, file))

print("Clean completed.")
