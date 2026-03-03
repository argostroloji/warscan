import os
import re

file_path = 'src/app/panel-layout.ts'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Bad imports inside the large component block
bad_imports = [
    r"  MacroSignalsPanel,\n",
    r"  ETFFlowsPanel,\n",
    r"  StablecoinPanel,\n",
    r"  InvestmentsPanel,\n",
    r"  GulfEconomiesPanel,\n",
    r"  GivingPanel,\n",
    r"import \{ SatelliteFiresPanel \} from \'@\/components\/SatelliteFiresPanel\';\n",
    r"import \{ PositiveNewsFeedPanel \} from \'@\/components\/PositiveNewsFeedPanel\';\n",
    r"import \{ CountersPanel \} from \'@\/components\/CountersPanel\';\n",
    r"import \{ ProgressChartsPanel \} from \'@\/components\/ProgressChartsPanel\';\n",
    r"import \{ BreakthroughsTickerPanel \} from \'@\/components\/BreakthroughsTickerPanel\';\n",
    r"import \{ HeroSpotlightPanel \} from \'@\/components\/HeroSpotlightPanel\';\n",
    r"import \{ GoodThingsDigestPanel \} from \'@\/components\/GoodThingsDigestPanel\';\n",
    r"import \{ SpeciesComebackPanel \} from \'@\/components\/SpeciesComebackPanel\';\n",
    r"import \{ RenewableEnergyPanel \} from \'@\/components\/RenewableEnergyPanel\';\n",
    r"import \{ GivingPanel \} from \'@\/components\';\n",
    r"import \{ focusInvestmentOnMap \} from \'@\/services\/investments-focus\';\n"
]

for p in bad_imports:
    text = re.sub(p, "", text)

# Clean happy variant properties destruction
text = re.sub(r"    this\.ctx\.countersPanel\?\.destroy\(\);\n", "", text)
text = re.sub(r"    this\.ctx\.progressPanel\?\.destroy\(\);\n", "", text)
text = re.sub(r"    this\.ctx\.breakthroughsPanel\?\.destroy\(\);\n", "", text)
text = re.sub(r"    this\.ctx\.heroPanel\?\.destroy\(\);\n", "", text)
text = re.sub(r"    this\.ctx\.digestPanel\?\.destroy\(\);\n", "", text)
text = re.sub(r"    this\.ctx\.speciesPanel\?\.destroy\(\);\n", "", text)
text = re.sub(r"    this\.ctx\.renewablePanel\?\.destroy\(\);\n", "", text)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Panel layout fully scrubbed!")
