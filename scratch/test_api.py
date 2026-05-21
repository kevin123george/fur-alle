import httpx
import sys

GENESIS_BASE = 'https://www.regionalstatistik.de/genesisws/rest/2020/data/table'
params = {'username': 'GAST', 'password': 'GAST', 'name': '82111-01-05-5', 'area': 'all', 'format': 'json', 'language': 'de'}

with httpx.Client(follow_redirects=True) as client:
    print('Testing GET to', GENESIS_BASE)
    resp = client.get(GENESIS_BASE, params=params)
    print(resp.status_code)
    if resp.status_code == 200:
        print(str(resp.text)[:200])
    else:
        print(resp.text[:200])

    print('Testing GET to old API')
    resp2 = client.get('https://www.regionalstatistik.de/genesis/api/data/table', params=params)
    print(resp2.status_code)
    if resp2.status_code == 200:
        print(str(resp2.text)[:200])
