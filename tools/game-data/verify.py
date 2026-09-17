"""Checks generated game-data coverage, numeric landmarks, and cross-references."""
import json
from pathlib import Path

root = Path(__file__).resolve().parents[2] / 'src/assets/game-data'
data = {path.stem: json.loads(path.read_text(encoding='utf-8')) for path in root.glob('*.json')}
for name, count in data['provenance']['counts'].items():
    assert len(data[name]) == count and count > 0, name
    assert all(row.get('source') for row in data[name]), name

spells = {row['registryId']: row for row in data['spells']}
assert spells['lod:flameshot']['damage'] == 50
assert spells['lod:divine_dg_cannon']['damage'] == 150
assert spells['lod:moon_light']['healPercent'] == 100
assert spells['lod:demons_gate']['damage'] is None
items = {row['registryId']: row for row in data['items']}
assert items['lod:broad_sword']['attack'] == 2
assert items['lod:healing_potion']['percentage'] == 50
assert items['lod:healing_rain']['targetAll'] is True
assert all(isinstance(row['price'], int) for row in items.values())
assert all(row['element'] != 'No' for row in data['spells'])
assert data['enemies'][0]['hp'] == 20 and data['enemies'][0]['element'] == 'Earth'
assert data['enemies'][4]['element'] == 'Fire'
assert len(data['enemies']) == 400
assert len(data['encounters']) == 512
assert len(data['stages']) == 96
for encounter in data['encounters']:
    assert isinstance(encounter['escapeChance'], int)
    assert encounter['enemyIds']
    assert all(0 <= int(value) < len(data['enemies']) for value in encounter['enemyIds'].split(', '))
for cut in data['submaps']:
    if cut['category'] == 'Cut':
        assert 0 <= cut['stageId'] < 96
print('Generated game-data coverage and cross-references passed')
