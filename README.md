# Rechnungsersteller

Eine kleine, rein clientseitige Web-App zum Erfassen von Rechnungspositionen
und Erzeugen einer fertigen Rechnung als PDF. Es gibt **keinen Server und
kein Backend** — die App besteht nur aus statischem HTML/CSS/JavaScript und
läuft komplett im Browser. Alle Daten (Positionen sowie Absender-/
Empfängerdaten) werden ausschließlich lokal im `localStorage` des Browsers
gespeichert und verlassen das Gerät nie von selbst.

## Funktionsumfang

- Rechnungspositionen erfassen (Beschreibung + Bruttobetrag), Positionen
  einzeln löschen oder alle auf einmal
- Rechnungsdetails (Rechnungsnummer, Leistungszeitraum, Erstellungsdatum)
- Stammdaten für Absender und Empfänger separat pflegen (`info.html`)
- Export der Rechnung als PDF (inkl. Mehrwertsteuerausweis, Kopf-/Fußzeile,
  mehrseitig bei vielen Positionen)
- Light- und Dark-Mode mit manuellem Umschalter (merkt sich die Wahl,
  startet sonst nach der Systemeinstellung)

## Projektstruktur

| Datei                | Zweck                                                                 |
| --------------------- | ---------------------------------------------------------------------- |
| `index.html`           | Startseite: Positionstabelle, Rechnungsdetails, PDF-Download            |
| `script.js`             | Logik der Startseite: Tabelle pflegen, localStorage, PDF-Erzeugung      |
| `info.html`             | Stammdaten-Seite: Absender-/Empfängerdaten                              |
| `info_script.js`        | Logik der Stammdaten-Seite                                              |
| `style.css`             | Gesamtes Styling inkl. Light-/Dark-Mode-Farbschema                      |
| `theme.js`              | Setzt/merkt sich Light-/Dark-Mode (siehe [Sicherheit](#sicherheit))     |
| `frame-guard.js`        | Klickjacking-Schutz (siehe [Sicherheit](#sicherheit))                  |
| `manifest.json`         | PWA-Manifest (aktuell nicht in den Seiten verlinkt)                    |

## Benutzung

Da es sich um rein statische Dateien handelt, genügt ein beliebiger
statischer Webserver im Projektordner, z. B.:

```bash
python3 -m http.server 8000
```

Danach `http://localhost:8000/index.html` im Browser öffnen. Ein direktes
Öffnen der `index.html` per `file://` funktioniert nicht zuverlässig, da
manche Browser dabei den `localStorage` pro Datei statt pro Origin isolieren
und die Content-Security-Policy je nach Browser unterschiedlich mit dem
`file://`-Schema umgeht.

### Erster Einstieg

1. Unter **„Details bearbeiten“** die eigenen Firmen-/Bankdaten sowie die
   Empfängerdaten einmalig hinterlegen und speichern.
2. Auf der Startseite Positionen eintragen (Beschreibung + Bruttobetrag,
   inkl. 19 % MwSt.) und mit „+“ oder Enter hinzufügen.
3. Rechnungsnummer und Zeitraum ausfüllen, dann „Als PDF herunterladen“.

## Technische Hinweise

- Beträge werden **brutto eingegeben**, aber **netto gespeichert**
  (`amount / 1.19`, siehe `addNewRow()` in `script.js`); die PDF-Erzeugung
  schlägt die 19 % MwSt. beim Export wieder auf.
- Die PDF-Erzeugung nutzt [jsPDF](https://github.com/parallax/jsPDF) und das
  [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)-
  Plugin, beide fest auf eine Version gepinnt und über cdnjs mit
  Subresource-Integrity-Prüfsumme eingebunden (siehe unten).
- Es gibt keinerlei Mehrbenutzer- oder Cloud-Synchronisierung: Alle Daten
  liegen ausschließlich im `localStorage` des jeweiligen Browsers/Geräts.

## Sicherheit

Dieses Projekt wurde nachträglich auf mehrere übliche Web-Schwachstellen hin
überprüft und entsprechend gehärtet. Der Abschnitt dokumentiert, was
umgesetzt wurde, warum, und wo es dabei Kompromisse gibt.

### Umgesetzt

**Persistente DOM-based XSS über das Beschreibungsfeld (behoben).**
Die Positionsbeschreibung wurde früher per `innerHTML` in die Tabelle
eingesetzt. Damit ließ sich beliebiges HTML/JavaScript einschleusen (z. B.
`<img src=x onerror=...>`), das dann bei jedem Laden der Seite erneut
ausgeführt worden wäre, weil die Beschreibung in `localStorage` liegt. Fix:
`script.js` rendert Beschreibung und Betrag jetzt ausschließlich über
`textContent`, das den Wert immer als reinen Text behandelt, nie als
ausführbares Markup (siehe `loadData()`/`addRow()`).

**Content-Security-Policy.** `index.html` und `info.html` setzen eine CSP
per `<meta>`-Tag: Skripte/Styles/Schriften/Verbindungen nur von der eigenen
Origin plus cdnjs (für jsPDF), `object-src 'none'`, eingeschränkte
`base-uri`/`form-action`. **Kompromiss:** `script-src` enthält
`'unsafe-inline'`, weil die App durchgängig `onclick`/`oninput`-Attribute
statt `addEventListener` verwendet. Eine vollständig inline-freie CSP hätte
einen größeren Umbau aller Event-Handler erfordert; das war nicht Teil
dieses Auftrags. Praktisch bedeutet das: Die CSP verhindert das Nachladen
fremder Skripte/das Abfließen von Daten an unbekannte Hosts, schützt aber
nicht zusätzlich vor genau der Art von Injection, die oben unter „XSS“
bereits an der Quelle behoben wurde.

**Subresource Integrity (SRI) für die CDN-Skripte.** Die beiden
`<script>`-Tags für jsPDF/jspdf-autotable in `index.html` tragen
`integrity="sha384-…"` sowie `crossorigin="anonymous"`. Der Browser
verweigert das Ausführen, falls die von cdnjs ausgelieferte Datei nicht
exakt zu diesem Hash passt (Schutz vor einer kompromittierten/manipulierten
CDN-Auslieferung). **Wichtiger Hinweis:** Die Hashes wurden aus den
identischen Versionen der npm-Pakete (`jspdf@2.3.1`,
`jspdf-autotable@3.5.14`) berechnet, nicht direkt aus der von cdnjs
ausgelieferten Datei, da cdnjs aus der Entwicklungsumgebung heraus nicht
erreichbar war. npm ist zwar dieselbe Quelle, aus der cdnjs seine Dateien
bezieht, eine Live-Verifikation gegen die tatsächlich von cdnjs
ausgelieferten Bytes steht aber noch aus. Falls die Seite den PDF-Download
nicht mehr anbietet und die Browser-Konsole einen SRI-/Integrity-Fehler
zeigt: Hash neu berechnen (`openssl dgst -sha384 -binary <datei> | openssl
base64 -A`) und in beiden `<script>`-Tags aktualisieren. Bei einem Wechsel
der jsPDF-/jspdf-autotable-Version müssen die Hashes ebenfalls neu berechnet
werden.

**Klickjacking-Schutz.** `X-Frame-Options` und die CSP-Direktive
`frame-ancestors` lassen sich nur per HTTP-Header setzen, nicht per
`<meta>` — und dieses Projekt hat als rein statische Seite keine eigene
Serverkonfiguration, über die sich HTTP-Header setzen ließen. Klassisches
JavaScript-„Frame-Busting“ (Weiterleitung von `window.top.location`) wurde
ausprobiert, aber verworfen: Aktuelle Browser blockieren diese Art der
Top-Level-Navigation ohne vorherige Nutzerinteraktion
([Chrome-Ankündigung](https://www.chromestatus.com/feature/5851021045661696)),
sodass sie in der Praxis nicht mehr zuverlässig funktioniert. Stattdessen
markiert `frame-guard.js` das Dokument nur als eingebettet
(`document.documentElement.setAttribute('data-framed', 'true')`), wenn
`window.top !== window.self`; `style.css` blendet in diesem Fall die gesamte
Seite aus und zeigt nur einen Warnhinweis. Das ist rein DOM/CSS-basiert,
benötigt keine browserseitig eingeschränkten Berechtigungen und
funktioniert daher zuverlässig.

**Kleinere Fixes im Zuge der Prüfung:**
- `checkWrongInput()` in `script.js` warf bei jeder fehlgeschlagenen
  Validierung einen `ReferenceError` (`return True;` statt `return true;`
  — `True` ist in JavaScript kein gültiger Bezeichner). Der Effekt für
  Nutzer war zufällig derselbe wie beabsichtigt (Abbruch), aber die Konsole
  füllte sich mit Fehlern. Behoben.
- `info_script.js` protokollierte die kompletten Stammdaten (inkl. Adresse)
  per `console.log` bei jedem Laden der Seite. Entfernt (kleine, aber
  unnötige Offenlegung in der Browser-Konsole).

### Bewusst nicht umgesetzt

**Unverschlüsselte, dauerhafte Speicherung sensibler Daten in
`localStorage`.** IBAN, BIC, Steuernummer und Kundenadressen liegen im
Klartext, zeitlich unbegrenzt, im `localStorage` des Browsers. Das ist kein
klassischer „Exploit“, aber ein Punkt für die Datenschutz-/Exposure-
Betrachtung: Alles mit Zugriff auf dieselbe Browser-Origin (z. B. eine
weitere, unabhängig gefundene XSS-Lücke, eine bösartige Browser-Erweiterung,
oder physischer Zugriff auf ein ungesperrtes Gerät) kann diese Daten lesen.
Eine echte Absicherung würde eine Passphrase-basierte Verschlüsselung
erfordern — das ist eine Produktentscheidung mit spürbaren UX-Konsequenzen
(Passwort-Eingabe bei jeder Nutzung, unwiederbringlicher Datenverlust bei
vergessenem Passwort) und wurde daher bewusst nicht ohne Rücksprache
umgesetzt.

**Veraltete Version von jsPDF (2.3.1).** Die App nutzt nur `text()`,
`line()` und `autoTable()` von jsPDF — nicht die risikoreichere
`html()`-Rendering-Methode, die HTML/CSS parst. Die Angriffsfläche einer
veralteten Version ist dadurch eingeschränkt; ein Update wurde dennoch
bewusst nicht durchgeführt (nicht angefragt, und ein Versionswechsel würde
auch neue SRI-Hashes erfordern, siehe oben).

## Bekannte Einschränkungen

- `manifest.json` referenziert Icon-Dateien (`images/icons/…`), die nicht
  im Repository enthalten sind, und ist aktuell auf keiner Seite
  verlinkt.
- Es existiert keine automatisierte Test-Suite (`npm test` ist ein reiner
  Platzhalter).
