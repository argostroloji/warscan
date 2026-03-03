import os
import re

# Fix main.ts implicit any
with open('src/main.ts', 'r', encoding='utf-8') as f:
    text = f.read()
text = re.sub(r"frames\.some\(f =>", "frames.some((f: any) =>", text)
text = re.sub(r"frames\.every\(f =>", "frames.every((f: any) =>", text)
with open('src/main.ts', 'w', encoding='utf-8') as f:
    f.write(text)

# Fix event-handlers.ts unused DEFAULT_PANELS
with open('src/app/event-handlers.ts', 'r', encoding='utf-8') as f:
    text = f.read()
text = re.sub(r"\n  DEFAULT_PANELS,\n", "\n", text)
with open('src/app/event-handlers.ts', 'w', encoding='utf-8') as f:
    f.write(text)

# Fix panel-layout unused imports
with open('src/app/panel-layout.ts', 'r', encoding='utf-8') as f:
    text = f.read()
for imp in ["  CryptoPanel,\n", "  PredictionPanel,\n", "  ServiceStatusPanel,\n", "  UcdpEventsPanel,\n", "  DisplacementPanel,\n", "  ClimateAnomalyPanel,\n", "  PopulationExposurePanel,\n", "  WorldClockPanel,\n"]:
    text = re.sub(imp, "", text)
# remove the remaining 'as Panel' from panel-layout
text = re.sub(r"as [A-Za-z]+Panel", "as any", text)
with open('src/app/panel-layout.ts', 'w', encoding='utf-8') as f:
    f.write(text)

# Fix data-loader TechReadinessPanel and unused
with open('src/app/data-loader.ts', 'r', encoding='utf-8') as f:
    text = f.read()
text = re.sub(r"  TechReadinessPanel,\n", "", text)
text = re.sub(r"import \{ getCircuitBreakerCooldownInfo, isFeatureAvailable \} from \'@\/services\/circuit-breaker\';\n", "", text)
text = re.sub(r"as TechReadinessPanel", "as any", text)

with open('src/app/data-loader.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print("Final fix 3 complete")
