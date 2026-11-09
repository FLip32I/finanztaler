# Amazon-Creators-API für Finanztaler

Vorbereitet für Amazon.de, Partner-Tag `finanztaler09-21` und Anmeldeinformationen Version 3.2. Die Anmeldeinformationen-ID allein reicht nicht; auch das beim Erstellen ausgegebene Secret ist erforderlich. Es gehört ausschließlich in GitHub-Secrets, niemals in HTML, JavaScript, JSON, einen Commit oder eine öffentliche Datei.

## Einrichtung

1. Die Dateien dieses Pakets mit ihrer Ordnerstruktur in das bestehende Repository `flip32i/finanztaler` übernehmen. Auch `.github/workflows/amazon-creators.yml` muss hochgeladen werden; der Ordner kann auf manchen Rechnern ausgeblendet sein.
2. Im Repository **Settings → Secrets and variables → Actions → New repository secret** diese zwei Secrets anlegen:
   - `AMAZON_CREATORS_CLIENT_ID`: die Anmeldeinformationen-ID aus PartnerNet, nicht die Applicationid.
   - `AMAZON_CREATORS_CLIENT_SECRET`: das zu genau dieser ID gehörende Secret aus der heruntergeladenen Amazon-Zugangsdaten-Datei. Falls es nicht mehr vorliegt, neue Anmeldeinformationen in PartnerNet erstellen und beide Werte zusammen ersetzen.
3. In `config/amazon-products.json` steht jede der 17 vorhandenen Produktkacheln. Das Feld `asin` kann zunächst leer bleiben: Das Skript versucht den vorhandenen Amazon-Kurzlink zur Produktseite aufzulösen. Falls Amazon die Weiterleitung nicht zulässt oder keine eindeutige Produktseite liefert, die exakte zehnstellige ASIN aus dem verlinkten Angebot dort ergänzen. Der Kurzlink-Code selbst ist keine ASIN. Keine ASIN anhand ähnlicher Produktnamen raten; Packungsgröße und Modell müssen zum verlinkten Angebot passen.
4. **Settings → Pages → Build and deployment → Source: GitHub Actions** auswählen. Dieser Workflow übernimmt danach die Veröffentlichung der gesamten vorhandenen Website. Einen eventuell bereits vorhandenen eigenen Pages-Veröffentlichungsworkflow deaktivieren, damit nicht zwei Workflows unterschiedliche Stände veröffentlichen. Die Datei `CNAME` und die bestehende benutzerdefinierte Domain bleiben erhalten.
5. Unter **Actions → Website mit Amazon Creators Bildern → Run workflow** starten. Wenn beim ersten Lauf die Freigabe der Umgebung `github-pages` verlangt wird, diesen Lauf im Repository freigeben.
6. Ein erfolgreicher Lauf veröffentlicht die Website mit dem frischen Bild-Feed. Bei Fehlern die Actions-Meldung prüfen: fehlende Secrets, nicht auflösbare ASIN, fehlende Produktdatenberechtigung oder API-Limit werden getrennt gemeldet. Der Status ACTIVE in PartnerNet ersetzt keinen erfolgreichen GetItems-Test.

## Verhalten

- Bilder erscheinen rechts neben dem Produkttext, wie im Beispiel. Auch das Bild führt zur offiziellen Produktseite mit dem von der API gelieferten Partnerlink.
- Alle 17 Kacheln für Kaffee, Technik und Hobbys sind vorbereitet. Die acht Buchcover und deren bisherige Quellen bleiben unverändert.
- Aktualisierung alle sechs Stunden sowie bei Änderungen am Branch `main`; zusätzlich manuell startbar. GitHub kann geplante Läufe verzögern und bei inaktiven öffentlichen Repositories nach längerer Zeit deaktivieren.
- Bilddateien werden nicht heruntergeladen oder im Repository gespeichert. Verwendet werden nur frische, von GetItems gelieferte Bild-URLs. Der Feed wird ausschließlich im Veröffentlichungsartefakt erzeugt, nicht in der Git-Historie abgelegt.
- Nach 23 Stunden blendet die Website API-Bilder aus, wenn keine Aktualisierung erfolgt ist. Bereits geöffnete Seiten prüfen die Frist ebenfalls. Bei fehlendem Bild bleibt die bisherige Textkachel mit Amazon-Button sichtbar, ohne leeren Bildrahmen.
- Keine Produktpreise, Bewertungen oder Verfügbarkeiten werden aus der API angezeigt.
- Secrets und Zugriffstokens werden weder in den öffentlichen Feed noch in die Website geschrieben. GitHub bewahrt das Veröffentlichungsartefakt einen Tag auf.
- Ein API-Fehler bricht die neue Veröffentlichung ab; der zuletzt veröffentlichte Stand bleibt erhalten. Andere Website-Änderungen werden dann erst nach Behebung des Fehlers veröffentlicht.

## Was bereits geprüft wurde

Syntax und Datenfluss mit nachgebildeten API-Antworten. Ein echter Token-/GetItems-Aufruf und die GitHub-Pages-Veröffentlichung konnten ohne deine Secrets und Repository-Verbindung nicht ausgeführt werden.

## Offizielle Dokumentation

- Authentifizierung und HTTP-Aufrufe: https://partnernet.amazon.de/creatorsapi/docs/en-us/get-started/using-curl
- GetItems und Bild-Ressourcen: https://affiliate-program.amazon.co.uk/creatorsapi/docs/en-us/api-reference/operations/get-items
- Lizenz/Bild-URL-Aktualisierung: https://partnernet.amazon.de/help/operating/license
