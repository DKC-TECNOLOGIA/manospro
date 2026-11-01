# City list snapshots

- `cities-BR.json` is generated from the IBGE Localidades municipalities endpoint.
- `cities-AR.json` is generated from Argentina's official GeoRef localities endpoint.
- Refresh both lists with `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/refresh-city-lists.ps1`.

Each item contains the source ID, locality/municipality name, and state or province details. The signup input accepts free text if a locality is absent from an official list.
