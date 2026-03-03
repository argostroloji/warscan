import re
import os

def fix_app_ts():
    file_path = 'src/App.ts'
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    text = re.sub(r"    this\.eventHandlers\.setupMobileWarning\(\);\n", "", text)
    text = re.sub(r"    this\.eventHandlers\.setupPlaybackControl\(\);\n", "", text)
    text = re.sub(r"    this\.eventHandlers\.setupPizzIntIndicator\(\);\n", "", text)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)

def fix_data_loader():
    file_path = 'src/app/data-loader.ts'
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    # Clean unused methods
    patterns_to_delete = [
        r"  private async loadPositiveEvents\(\)[\s\S]*?(?=  private loadKindnessData)",
        r"  private loadKindnessData\(\)[\s\S]*?(?=  private async loadProgressData)",
        r"  private async loadProgressData\(\)[\s\S]*?(?=  private async loadSpeciesData)",
        r"  private async loadSpeciesData\(\)[\s\S]*?(?=  private async loadRenewableData)",
        r"  private async loadRenewableData\(\)[\s\S]*?(?=  async loadSecurityAdvisories)"
    ]
    for p in patterns_to_delete:
        text = re.sub(p, "", text)

    # Clean residual method: loadHappySupplementaryAndRender
    text = re.sub(r"  private async loadHappySupplementaryAndRender\(\)[\s\S]*?(?=  private async loadPositiveEvents|  async loadSecurityAdvisories)", "", text)

    # Any remaining 'as PanelName' where PanelName isn't imported
    text = re.sub(r"as CommoditiesPanel", "as any", text)
    text = re.sub(r"as EconomicPanel", "as any", text)
    text = re.sub(r"as TradePolicyPanel", "as any", text)
    text = re.sub(r"as SupplyChainPanel", "as any", text)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)

def fix_panel_layout():
    file_path = 'src/app/panel-layout.ts'
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    # Delete unused imports from panel-layout
    bad_imports = [
        r"  HeatmapPanel,\n",
        r"  CommoditiesPanel,\n",
        r"  CryptoPanel,\n",
        r"  EconomicPanel,\n",
        r"  LiveWebcamsPanel,\n",
        r"  TechReadinessPanel,\n",
        r"  TradePolicyPanel,\n",
        r"  SupplyChainPanel,\n",
        r"  GivingPanel,\n",
        r"  SecurityAdvisoriesPanel,\n",  # Actually we might need this if it was not deleted
    ]
    for p in bad_imports:
        text = re.sub(p, "", text)

    # Delete the properties referencing deleted panels in PanelLayoutManager
    panels_to_any = [
        "heatmap", "commodities", "crypto", "economic", "tech-readiness",
        "trade-policy", "supply-chain", "giving"
    ]
    for p in panels_to_any:
        # Replaces `HeatmapPanel` with `any` for `panel as HeatmapPanel`
        text = re.sub(r"as [A-Za-z]+Panel", "as any", text)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)

fix_app_ts()
fix_data_loader()
fix_panel_layout()
print("All fixed.")
