# Technische Dokumentation — Rechnungsersteller

Diese Datei ist die vollständige technische Referenz des Projekts: Architektur,
jede Datei und Funktion im Detail, das Datenmodell, die PDF-Erzeugung und die
Sicherheitsmaßnahmen inkl. ihrer Kompromisse. Für einen schnellen Einstieg
siehe [README.md](./README.md).

## Inhalt

1. [Architektur](#architektur)
2. [Seiten und Dateien](#seiten-und-dateien)
3. [Datenmodell (localStorage)](#datenmodell-localstorage)
4. [Geschäftslogik im Detail](#geschäftslogik-im-detail)
5. [Design-System](#design-system)
6. [Sicherheit](#sicherheit)
7. [Bekannte Einschränkungen und offene TODOs](#bekannte-einschränkungen-und-offene-todos)
8. [Entwicklung](#entwicklung)

## Architektur

Der Rechnungsersteller ist eine **rein clientseitige, serverlose** Web-App:
zwei statische HTML-Seiten, dazu einfaches, ungebündeltes JavaScript (kein
Build-Schritt, kein Framework, kein Modulsystem — alle Funktionen hängen am
globalen `window`-Scope und werden über klassische `<script src="...">`-Tags
geladen). Es gibt keine Datenbank und keine API: jeglicher Zustand lebt im
`localStorage` des jeweiligen Browsers.

```
┌─────────────────────┐        ┌─────────────────────┐
│      index.html      │        │      info.html       │
│  (Positionen, PDF)    │◄──────►│  (Stammdaten)         │
└──────────┬───────────┘        └──────────┬───────────┘
           │                               │
           ▼                               ▼
   localStorage['myData']         localStorage['infoData']
   (Array von Positionen)         (Array mit einem Objekt)
           │                               │
           └───────────────┬───────────────┘
                            ▼
                   script.js: erstelleRechnung()
                            │
                            ▼
                  jsPDF + jspdf-autotable
                            │
                            ▼
                     Rechnung_TT_M_JJJJ.pdf
                     (lokaler Download)
```

Beide Seiten teilen sich `style.css`, `theme.js` (Light-/Dark-Mode) und
`frame-guard.js` (Klickjacking-Schutz). Es gibt keine Navigation außerhalb
dieser zwei Seiten und keinerlei Netzwerkkommunikation außer dem Laden von
jsPDF/jspdf-autotable von cdnjs.cloudflare.com beim Öffnen von `index.html`.

## Seiten und Dateien

### `index.html`

Die Startseite. Enthält:

- Den Header mit Titel, Theme-Toggle-Button und Link zu `info.html`.
- Die Positionstabelle (`<table id="table">`). Die **erste Zeile ist immer
  die Kopfzeile** (Pos/Beschreibung/Betrag), die **letzte Zeile ist immer
  die feste Eingabezeile** (Textarea für die Beschreibung, Textfeld für den
  Betrag, "+"-Button). Alle dazwischenliegenden Zeilen sind per JavaScript
  eingefügte Positionen — siehe [`script.js`](#scriptjs) und
  [Tabellen-Einfügemechanik](#tabellen-einfügemechanik).
- Die Rechnungsdetails (Rechnungsnummer, Leistungszeitraum, Erstellungsdatum).
- Die Aktionsleiste ("Alles löschen" mit Bestätigungsmodal, "Als PDF
  herunterladen").
- Ein `.frame-warning`-Element, das nur sichtbar wird, wenn die Seite in
  einem fremden `<iframe>` eingebettet ist (siehe [Sicherheit](#sicherheit)).

Wichtige IDs, auf die sich `script.js` verlässt (bei Änderungen am Markup
unbedingt beachten): `#table`, `#description`, `#amount`, `#invoiceNr`,
`#startDate`, `#endDate`, `#createDate`, `#downloadButton`,
`#deleteAllButton`, `#meinModal`.

### `script.js`

Die gesamte Logik der Startseite. Funktionsreferenz (Aufrufreihenfolge in
etwa von "beim Laden" bis "PDF-Export"):

| Funktion | Zweck | Aufgerufen von |
| --- | --- | --- |
| `loadData()` | Liest `localStorage['myData']`, baut daraus die Tabellenzeilen auf | `DOMContentLoaded`-Listener |
| `deleteButtonHTML()` | Liefert das statische Markup des Papierkorb-Buttons | `loadData()`, `addRow()` |
| `anpassenFeld()` | Lässt das Beschreibungs-Textarea automatisch mitwachsen | `oninput` auf `#description` |
| `addNewRow()` | Validiert die Eingabezeile, rechnet Brutto→Netto um, ruft `addRow()` + `save()` | `onclick`/Enter auf die Eingabezeile |
| `checkWrongInput(description, amount)` | Validiert Betrag (≥ 0, Zahl) und Beschreibung (nicht leer) | `addNewRow()` |
| `addRow(description, amount)` | Fügt eine neue `<tr>` für eine Position ein (reine DOM-Operation) | `addNewRow()` |
| `resetInput()` | Leert die Eingabefelder nach dem Hinzufügen | `addNewRow()` |
| `save(description, amount)` | Schreibt `loadedData` nach `localStorage['myData']` | `addNewRow()` |
| `deleteRow(btn)` | Entfernt eine einzelne Position aus DOM, Array und localStorage | `onclick` auf einen Papierkorb-Button |
| `deleteAll()` | Löscht `localStorage['myData']` komplett und lädt die Seite neu | "Löschen" im Bestätigungsmodal |
| `schließeModal()` / `window.onclick` | Schließt das Bestätigungsmodal | Modal-Buttons / Klick außerhalb |
| `download()` | Validiert die Rechnungsdetails, baut die Datenstruktur für `erstelleRechnung()` | "Als PDF herunterladen" |
| `erstelleRechnung(daten)` | Baut das PDF-Dokument mit jsPDF/autoTable auf und speichert es | `download()` |
| `getInfo()` | Liest `localStorage['infoData']` (mit Platzhalter-Fallback) | `erstelleRechnung()` |

Jede dieser Funktionen ist zusätzlich direkt im Quellcode mit einem
Docstring-Kommentar versehen.

### `info.html`

Die Stammdaten-Seite. Zwei Formularspalten ("Absender" und "Empfänger"),
jeweils reine `<label>`/`<input>`-Paare ohne `<form>`-Element (die Werte
werden per JavaScript ausgelesen, kein natives Formular-Submit). Teilt sich
Header-Aufbau, Theme-Toggle und Klickjacking-Schutz mit `index.html`.

### `info_script.js`

| Funktion | Zweck |
| --- | --- |
| `loadInfoData()` | Befüllt beim Laden alle Formularfelder aus `localStorage['infoData']` |
| `saveDetails()` | Liest alle Formularfelder aus, überschreibt `localStorage['infoData']` komplett |

Es wird **immer nur ein einziger Datensatz** gehalten — kein Verlauf, keine
mehreren Profile. Erneutes Speichern überschreibt den vorherigen Stand
vollständig.

### `theme.js`

Regelt Light-/Dark-Mode für beide Seiten:

- Eine sofort ausgeführte Funktion (IIFE) setzt `data-theme="light"` oder
  `data-theme="dark"` auf `<html>`, **bevor** irgendetwas gerendert wird
  (daher als erstes Skript im `<head>` eingebunden — verhindert ein kurzes
  Aufblitzen im falschen Modus). Priorität: gespeicherte Wahl in
  `localStorage['theme']` > Systemeinstellung (`prefers-color-scheme`).
- `toggleTheme()` wechselt den Modus und speichert die Wahl dauerhaft.
  Wird vom Sonne/Mond-Button im Header aufgerufen.

### `frame-guard.js`

Best-effort-Klickjacking-Schutz. Details siehe [Sicherheit](#sicherheit).

### `style.css`

Ein einziges Stylesheet für beide Seiten, aufgebaut auf CSS Custom
Properties (siehe [Design-System](#design-system)). Grobe Gliederung
(Abschnittskommentare im Code): Design-Tokens (inkl. Dark-Mode-Override) →
Klickjacking-Warnhinweis → Seiten-/Sheet-Layout → Header → Tabelle →
Formulare/Eingaben → Rechnungsdetails → Buttons → Stammdaten-Formular →
Modal → Responsive (`@media max-width: 640px`).

## Datenmodell (localStorage)

Es werden genau drei Schlüssel verwendet, alle unter derselben Origin, ohne
Ablaufdatum, ohne Verschlüsselung:

**`myData`** — Array der Rechnungspositionen, wie von `save()` geschrieben:

```json
[
  { "description": "Beratung zur Softwarearchitektur", "amount": "100,00 €" },
  { "description": "Projektmanagement und Koordination", "amount": "200,00 €" }
]
```

`amount` ist hier bereits der **Nettobetrag**, als deutsch formatierter
String inkl. `€`-Zeichen (siehe [Brutto/Netto-Umrechnung](#bruttonetto-umrechnung)).

**`infoData`** — Array mit **genau einem** Objekt (Absender-/Empfängerdaten),
wie von `saveDetails()` geschrieben:

```json
[
  {
    "firmName": "Musterfirma Müller",
    "senderFirstName": "Max",
    "senderSurName": "Mustermann",
    "senderAddress": "Ringstraße 12",
    "senderPlz": "12345",
    "senderCity": "Testdorf",
    "phone": "0234 / 500 60 10",
    "strNr": "12345-12345",
    "mwstNr": "DE 123456789",
    "bankName": "Musterbank Musterstadt",
    "iban": "DE12 1234 1234 1234 1234 12",
    "bic": "ABCDEFGHIJK",
    "recieverName": "Max Mustermann",
    "recieverAddress": "Musterstr. 12",
    "recieverCity": "Musterhausen"
  }
]
```

Wurde noch nie gespeichert, liefert `getInfo()` in `script.js` ein
hartcodiertes Platzhalter-Objekt mit denselben Feldern (Musterfirma), damit
die PDF-Erzeugung nicht an `undefined`-Werten scheitert.

**`theme`** — einfacher String, `"light"` oder `"dark"`, von `theme.js`
geschrieben.

> Alle drei Werte sind ungeprüfter Nutzer- bzw. localStorage-Inhalt. Beim
> Rendern in die Tabelle wird bewusst `textContent` statt `innerHTML`
> verwendet, damit ein manipulierter oder böswillig eingegebener Wert nie
> als HTML/JavaScript interpretiert wird (siehe [Sicherheit](#sicherheit)).

## Geschäftslogik im Detail

### Brutto/Netto-Umrechnung

Der Nutzer gibt in der Eingabezeile den **Bruttobetrag** ein. `addNewRow()`
rechnet ihn sofort auf den Nettobetrag herunter (19 % MwSt. fest
hinterlegt, kein einstellbarer Steuersatz):

```js
var amount = Math.round((parseFloat(rawInput) / 1.19) * 100) / 100;
```

Gespeichert und in der Tabelle angezeigt wird ausschließlich dieser
Nettobetrag. Bei der PDF-Erzeugung schlägt `erstelleRechnung()`/`calc_sum()`
die 19 % MwSt. wieder auf, um Netto-, MwSt.- und Bruttobetrag getrennt
auszuweisen.

### Tabellen-Einfügemechanik

Die Positionstabelle hat eine feste Struktur: Zeile 0 ist immer die
Kopfzeile, die letzte Zeile ist immer die Eingabezeile (Textarea + Betrag +
"+"-Button, direkt im HTML von `index.html` verdrahtet). Neue Positionen
dürfen deshalb **nicht** ans Ende der Tabelle angehängt werden — sonst
würde die Eingabezeile nach oben wandern. Stattdessen fügen `loadData()`
und `addRow()` jede neue Zeile gezielt **vor** der letzten Zeile ein:

```js
let insertIndex = table.rows.length - 1; // Index der aktuell letzten Zeile
table.insertRow(insertIndex);            // schiebt die Eingabezeile eins nach hinten
```

Da die Kopfzeile Index 0 belegt, entspricht `insertIndex` nach dem Einfügen
direkt der fortlaufenden Positionsnummer der neuen Zeile (`addRow()` nutzt
das für das Pos-Badge). Beim Löschen einer Zeile (`deleteRow()`) gilt
entsprechend: `row.rowIndex - 1` liefert den Index in `loadedData`, weil
Zeile 0 (Kopfzeile) kein Gegenstück im Array hat.

### PDF-Layout (`erstelleRechnung()`)

jsPDF arbeitet mit einem Koordinatensystem in **Millimetern**, Ursprung
oben links, Standardformat A4 (210 × 297 mm). Die Funktion ist bewusst
prozedural (ein `TODO` im Code vermerkt, das perspektivisch in einzelne
Funktionen aufgeteilt werden sollte) und zeichnet in dieser Reihenfolge:

1. `kopfzeile()` (Firmenname + Absender oben links) und `fusszeile()`
   (Absender/Steuer-ID/Bankverbindung unten) — beide werden über
   `didDrawPage` bei jeder neuen Seite erneut aufgerufen, damit
   mehrseitige Rechnungen durchgängig Kopf-/Fußzeile haben.
2. Absenderzeile mit Trennlinie, Empfängeradresse, Absenderblock oben
   rechts (inkl. dem bewusst fest hinterlegten Text „Mega Möbel
   Spedition" — kein Datenfeld, kein Bug).
3. „Rechnung"-Titel, Rechnungsnummer, Datum, Leistungszeitraum-Satz.
4. Die Positionstabelle via `doc.autoTable()` (Plugin von
   jspdf-autotable, hängt sich selbst an die `jsPDF`-Instanz).
5. Die Summenzeile (Netto/MwSt./Brutto), berechnet über `calc_sum()` +
   `parseGermanNumber()` (wandelt deutsch formatierte Beträge wie
   `"1.234,56"` zurück in eine JS-Zahl).
6. Speichern als `Rechnung_<Tag>_<Monat>_<Jahr>.pdf` über
   `doc.save(...)`.

## Design-System

Alle Farben, Radien und Schatten sind als CSS Custom Properties in
`:root` (Light Mode) definiert und unter `:root[data-theme="dark"]`
überschrieben — Komponenten referenzieren nur die Variablen, nie feste
Farbwerte.

| Token | Light | Dark | Verwendung |
| --- | --- | --- | --- |
| `--color-bg` | `#f6f5f1` | `#16181c` | Seitenhintergrund |
| `--color-surface` | `#ffffff` | `#1e2126` | Karten/Sheet-Hintergrund |
| `--color-border` | `#e5e2d9` | `#2d3138` | Dezente Trennlinien |
| `--color-border-strong` | `#d8d4c7` | `#3c414a` | Input-Unterstriche, Button-Rahmen |
| `--color-ink` | `#17181c` | `#f1f0ea` | Primärer Text |
| `--color-muted` | `#6f7278` | `#9a9ea6` | Sekundärer Text, Labels |
| `--color-accent` | `#0f766e` | `#2dd4bf` | Primäraktionen, Fokuszustand |
| `--color-accent-light` | `#e5f3f1` | `rgba(45,212,191,.08)` | Betrag-Spalte, Pos-Badge |
| `--color-danger` | `#ab2b23` | `#f87171` | Löschen-Aktionen |

Typografie: Systemschriftstack (`-apple-system, ...`) für Fließtext,
`ui-monospace, ...` gezielt für Zahlen (Beträge, Rechnungsnummer, Daten,
Pos-Badge) — sorgt für gleichmäßige Ziffernbreiten und eine "Beleg"-Anmutung.
Radien/Schatten sind in drei Stufen (`sm`/`md`/`lg`) skaliert, siehe
Tokens in `style.css`.

## Sicherheit

Dieses Projekt wurde nachträglich auf mehrere übliche Web-Schwachstellen
geprüft und entsprechend gehärtet. Dieser Abschnitt dokumentiert, was
umgesetzt wurde, warum, und wo es dabei bewusste Kompromisse gibt.

### Umgesetzt

**Persistente DOM-based XSS über das Beschreibungsfeld (behoben).**
Die Positionsbeschreibung wurde früher per `innerHTML` in die Tabelle
eingesetzt. Damit ließ sich beliebiges HTML/JavaScript einschleusen (z. B.
`<img src=x onerror=...>`), das dann bei jedem Laden der Seite erneut
ausgeführt worden wäre, weil die Beschreibung in `localStorage` liegt.
Fix: `script.js` rendert Beschreibung und Betrag jetzt ausschließlich über
`textContent`, das den Wert immer als reinen Text behandelt, nie als
ausführbares Markup (`loadData()`/`addRow()`). Verifiziert mit einem
echten Payload im Beschreibungsfeld (auch nach Reload, also über den
`loadData()`-Pfad).

**Content-Security-Policy.** `index.html` und `info.html` setzen eine CSP
per `<meta>`-Tag: Skripte/Styles/Schriften/Verbindungen nur von der
eigenen Origin plus cdnjs (für jsPDF), `object-src 'none'`, eingeschränkte
`base-uri`/`form-action`. **Kompromiss:** `script-src` enthält
`'unsafe-inline'`, weil die App durchgängig `onclick`/`oninput`-Attribute
statt `addEventListener` verwendet. Eine vollständig inline-freie CSP
hätte einen größeren Umbau aller Event-Handler erfordert. Praktisch
bedeutet das: Die CSP verhindert das Nachladen fremder Skripte und das
Abfließen von Daten an unbekannte Hosts, schützt aber nicht zusätzlich vor
genau der Art von Injection, die oben unter „XSS" bereits an der Quelle
behoben wurde.

**Subresource Integrity (SRI) für die CDN-Skripte.** Die beiden
`<script>`-Tags für jsPDF/jspdf-autotable in `index.html` tragen
`integrity="sha384-…"` sowie `crossorigin="anonymous"`. Der Browser
verweigert das Ausführen, falls die von cdnjs ausgelieferte Datei nicht
exakt zu diesem Hash passt. **Wichtiger Hinweis:** Die Hashes wurden aus
den identischen Versionen der npm-Pakete (`jspdf@2.3.1`,
`jspdf-autotable@3.5.14`) berechnet, nicht direkt aus der von cdnjs
ausgelieferten Datei (cdnjs war aus der Entwicklungsumgebung heraus nicht
erreichbar). npm ist zwar dieselbe Quelle, aus der cdnjs seine Dateien
bezieht, eine Live-Verifikation gegen die tatsächlich von cdnjs
ausgelieferten Bytes steht aber noch aus. Falls die Seite den
PDF-Download nicht mehr anbietet und die Browser-Konsole einen
SRI-/Integrity-Fehler zeigt: Hash neu berechnen
(`openssl dgst -sha384 -binary <datei> | openssl base64 -A`) und in
beiden `<script>`-Tags aktualisieren. Bei einem Versionswechsel von
jsPDF/jspdf-autotable müssen die Hashes ebenfalls neu berechnet werden.

**Klickjacking-Schutz.** `X-Frame-Options` und die CSP-Direktive
`frame-ancestors` lassen sich nur per HTTP-Header setzen, nicht per
`<meta>` — und dieses Projekt hat als rein statische Seite keine eigene
Serverkonfiguration, über die sich HTTP-Header setzen ließen. Klassisches
JavaScript-„Frame-Busting" (Weiterleitung von `window.top.location`)
wurde ausprobiert, aber verworfen: Aktuelle Browser blockieren diese Art
der Top-Level-Navigation ohne vorherige Nutzerinteraktion
([Chrome-Ankündigung](https://www.chromestatus.com/feature/5851021045661696)),
sodass sie in der Praxis nicht mehr zuverlässig funktioniert (im Test:
Chrome wirft `"Unsafe attempt to initiate navigation..."` und bricht ab).
Stattdessen markiert `frame-guard.js` das Dokument nur als eingebettet
(`document.documentElement.setAttribute('data-framed', 'true')`), wenn
`window.top !== window.self`; `style.css` blendet in diesem Fall die
gesamte Seite aus und zeigt nur einen Warnhinweis. Das ist rein
DOM/CSS-basiert, benötigt keine browserseitig eingeschränkten
Berechtigungen und funktioniert daher zuverlässig — verifiziert per
Playwright-Test (Seite in einem `<iframe>` geladen → Inhalt wird
ausgeblendet, Warnhinweis erscheint).

**Kleinere Fixes im Zuge der Prüfung:**
- `checkWrongInput()` in `script.js` warf bei jeder fehlgeschlagenen
  Validierung einen `ReferenceError` (`return True;` statt
  `return true;` — `True` ist in JavaScript kein gültiger Bezeichner).
  Der Effekt für Nutzer war zufällig derselbe wie beabsichtigt (Abbruch),
  aber die Konsole füllte sich mit Fehlern. Behoben.
- `info_script.js` protokollierte die kompletten Stammdaten (inkl.
  Adresse, IBAN, BIC) per `console.log` bei jedem Laden der Seite.
  Entfernt.

### Bewusst nicht umgesetzt

**Unverschlüsselte, dauerhafte Speicherung sensibler Daten in
`localStorage`.** IBAN, BIC, Steuernummer und Kundenadressen liegen im
Klartext, zeitlich unbegrenzt, im `localStorage` des Browsers. Kein
klassischer „Exploit", aber relevant für die Datenschutz-/
Exposure-Betrachtung: Alles mit Zugriff auf dieselbe Browser-Origin (eine
unabhängig gefundene weitere XSS-Lücke, eine bösartige
Browser-Erweiterung, physischer Zugriff auf ein ungesperrtes Gerät) kann
diese Daten lesen. Eine echte Absicherung würde eine
Passphrase-basierte Verschlüsselung erfordern — das ist eine
Produktentscheidung mit spürbaren UX-Konsequenzen (Passwort-Eingabe bei
jeder Nutzung, unwiederbringlicher Datenverlust bei vergessenem
Passwort) und wurde daher bewusst nicht ohne Rücksprache umgesetzt.

**Veraltete Version von jsPDF (2.3.1).** Die App nutzt nur `text()`,
`line()` und `autoTable()` von jsPDF — nicht die risikoreichere
`html()`-Rendering-Methode, die HTML/CSS parst. Die Angriffsfläche einer
veralteten Version ist dadurch eingeschränkt; ein Update wurde dennoch
bewusst nicht durchgeführt (ein Versionswechsel würde auch neue
SRI-Hashes erfordern).

## Bekannte Einschränkungen und offene TODOs

- `manifest.json` referenziert Icon-Dateien (`images/icons/…`), die nicht
  im Repository enthalten sind, und ist aktuell auf keiner Seite verlinkt.
- Es existiert keine automatisierte Test-Suite (`npm test` in
  `package.json` ist ein reiner Platzhalter). Alle Regressionstests in
  diesem Projekt wurden manuell per Playwright während der Entwicklung
  gefahren, sind aber nicht Teil des Repositories.
- Im Code als `TODO` markiert: `erstelleRechnung()` sollte in kleinere
  Funktionen aufgeteilt werden (aktuell eine sehr lange, prozedurale
  Funktion mit mehreren verschachtelten Hilfsfunktionen), `calc_sum()`
  könnte effizienter implementiert werden, `download()` ist als
  "TODO: refactor" markiert.
- Es gibt keinen einstellbaren Mehrwertsteuersatz — die 19 % sind an
  mehreren Stellen in `script.js` fest hinterlegt (`addNewRow()`,
  `erstelleRechnung()`).
- Keine Undo-Funktion für "Alles löschen" — nach Bestätigung sind alle
  Positionen unwiderruflich weg (Stammdaten in `infoData` bleiben davon
  unberührt).

## Entwicklung

Lokal starten (rein statische Dateien, jeder Webserver reicht):

```bash
python3 -m http.server 8000
```

Danach `http://localhost:8000/index.html` öffnen. `file://`-Aufruf ohne
Server funktioniert nicht zuverlässig (siehe README.md).

Beim Ändern von `index.html`/`info.html` unbedingt beachten:

- IDs, die `script.js`/`info_script.js` per `getElementById` referenzieren,
  nicht umbenennen, ohne das jeweilige Skript anzupassen.
- Die Tabellenstruktur (Kopfzeile = Index 0, Eingabezeile = letzte Zeile)
  ist Voraussetzung für die [Tabellen-Einfügemechanik](#tabellen-einfügemechanik)
  — wird sie geändert, müssen `loadData()`/`addRow()`/`deleteRow()`
  mitgezogen werden.
- Neue Farben/Abstände als CSS Custom Property in `style.css` anlegen
  (Light- **und** Dark-Wert), nie als hartcodierten Hex-Wert in einer
  Komponentenregel — sonst bricht der Dark Mode für diese Stelle.
