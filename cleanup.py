import os, shutil

base = 'C:/Users/eray/.gemini/antigravity/scratch/warscan'

# Config files to remove
config_remove = [
    'gulf-fdi.ts', 'startup-ecosystems.ts', 'tech-companies.ts',
    'tech-geo.ts', 'finance-geo.ts', 'ai-datacenters.ts',
    'ai-regulations.ts', 'ai-research-labs.ts', 'irradiators.ts'
]

# Variant files to remove
variant_remove = ['happy.ts', 'tech.ts', 'finance.ts']

# API directories to remove
api_dirs_remove = [
    'economic', 'eia', 'giving', 'positive-events',
    'supply-chain', 'trade', 'youtube'
]

# API files to remove
api_files_remove = [
    'ais-snapshot.js', 'oref-alerts.js', 'telegram-feed.js',
    'register-interest.js'
]

# Data dir files to remove
data_remove = ['gamma-irradiators-raw.json', 'gamma-irradiators.json']

# Other dirs to remove
other_dirs = [
    'src/live-channels-main.ts', 'src/live-channels-window.ts',
    'src/settings-main.ts', 'src/settings-window.ts',
    'data/gamma-irradiators-raw.json', 'data/gamma-irradiators.json',
]

# Remove config files
for f in config_remove:
    p = os.path.join(base, 'src/config', f)
    if os.path.exists(p):
        os.remove(p)
        print(f'Removed: {p}')

# Remove variant files
for f in variant_remove:
    p = os.path.join(base, 'src/config/variants', f)
    if os.path.exists(p):
        os.remove(p)
        print(f'Removed: {p}')

# Remove API dirs
for d in api_dirs_remove:
    p = os.path.join(base, 'api', d)
    if os.path.exists(p):
        shutil.rmtree(p)
        print(f'Removed dir: {p}')

# Remove API files
for f in api_files_remove:
    p = os.path.join(base, 'api', f)
    if os.path.exists(p):
        os.remove(p)
        print(f'Removed: {p}')

# Remove other files
for f in other_dirs:
    p = os.path.join(base, f)
    if os.path.exists(p):
        os.remove(p)
        print(f'Removed: {p}')

# Remove convex dir (unnecessary)
for d in ['convex', 'deploy', 'e2e', 'tests', 'tmp', 'docs', 'scripts', '.husky', '.github']:
    p = os.path.join(base, d)
    if os.path.exists(p):
        shutil.rmtree(p)
        print(f'Removed dir: {p}')

# Remove misc files
for f in ['CHANGELOG.md', 'CODE_OF_CONDUCT.md', 'CONTRIBUTING.md', 'SECURITY.md',
          'Makefile', 'railpack.json', 'skills-lock.json', 'verbose-mode.json',
          'playwright.config.ts', 'tsconfig.api.json', '.markdownlint-cli2.jsonc',
          'api-cache.json', 'middleware.ts']:
    p = os.path.join(base, f)
    if os.path.exists(p):
        os.remove(p)
        print(f'Removed: {p}')

print('\n=== CLEANUP COMPLETE ===')
