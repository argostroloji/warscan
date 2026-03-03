import re

def fix_main():
    with open('src/main.ts', 'r', encoding='utf-8') as f:
        text = f.read()

    # Remove Sentry entirely
    # The Sentry code is between `import * as Sentry` and `// Suppress NotAllowedError`
    pattern = r"import \* as Sentry from '@sentry/browser';[\s\S]*?(?=// Suppress NotAllowedError)"
    text = re.sub(pattern, "", text)

    with open('src/main.ts', 'w', encoding='utf-8') as f:
        f.write(text)

def fix_data_loader():
    with open('src/app/data-loader.ts', 'r', encoding='utf-8') as f:
        text = f.read()

    # Remove SatelliteFiresPanel unused import
    text = re.sub(r"import \{ SatelliteFiresPanel \} from '@\/components\/SatelliteFiresPanel';\n", "", text)

    # Remove lingering switch cases
    switch_pattern = r"        case 'positiveEvents':\n          await this\.loadPositiveEvents\(\);\n          break;\n        case 'kindness':\n          this\.loadKindnessData\(\);\n          break;\n        case 'iranAttacks':\n          await this\.loadIranEvents\(\);\n          break;\n"
    text = re.sub(switch_pattern, "", text)

    # Remove lingering happy supplementary calls
    happy_pattern = r"      if \(SITE_VARIANT === 'happy'\) \{\n        setTimeout\(\(\) => \{\n          this\.loadHappySupplementaryAndRender\(\)\.catch\(\(\) => \{\}\);\n          Promise\.all\(\[\n            this\.loadPositiveEvents\(\),\n            this\.loadKindnessData\(\),\n          \]\)\.catch\(\(\) => \{\}\);\n        \}, 3000\);\n      \}\n"
    text = re.sub(happy_pattern, "", text)

    # Fix e implicitly has any
    text = re.sub(r"\.catch\(e => console\.warn", ".catch((e: any) => console.warn", text)

    with open('src/app/data-loader.ts', 'w', encoding='utf-8') as f:
        f.write(text)

fix_main()
fix_data_loader()
print("Done")
