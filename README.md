# Rechnungsersteller

Eine kleine, rein clientseitige Web-App zum Erfassen von Rechnungspositionen
und Erzeugen einer fertigen Rechnung als PDF. Es gibt **keinen Server und
kein Backend** — die App besteht nur aus statischem HTML/CSS/JavaScript und
läuft komplett im Browser. Alle Daten (Positionen sowie Absender-/
Empfängerdaten) werden ausschließlich lokal im `localStorage` des Browsers
gespeichert und verlassen das Gerät nie von selbst.

Die vollständige technische Dokumentation — Architektur, jede Datei und
Funktion im Detail, Datenmodell, PDF-Aufbau, Design-System und die
umgesetzten Sicherheitsmaßnahmen — steht in [DOCUMENTATION.md](./DOCUMENTATION.md).

## Funktionsumfang

- Rechnungspositionen erfassen (Beschreibung + Bruttobetrag), Positionen
  einzeln löschen oder alle auf einmal
- Rechnungsdetails (Rechnungsnummer, Leistungszeitraum, Erstellungsdatum)
- Stammdaten für Absender und Empfänger separat pflegen (`info.html`)
- Export der Rechnung als PDF (inkl. Mehrwertsteuerausweis, Kopf-/Fußzeile,
  mehrseitig bei vielen Positionen)
- Light- und Dark-Mode mit manuellem Umschalter (merkt sich die Wahl,
  startet sonst nach der Systemeinstellung)

## Schnellstart

Rein statische Dateien — ein beliebiger statischer Webserver im
Projektordner genügt, z. B.:

```bash
python3 -m http.server 8000
```

Danach `http://localhost:8000/index.html` im Browser öffnen. Ein direktes
Öffnen der `index.html` per `file://` funktioniert nicht zuverlässig, da
manche Browser dabei den `localStorage` pro Datei statt pro Origin isolieren
und die Content-Security-Policy je nach Browser unterschiedlich mit dem
`file://`-Schema umgeht.

1. Unter **„Details bearbeiten“** die eigenen Firmen-/Bankdaten sowie die
   Empfängerdaten einmalig hinterlegen und speichern.
2. Auf der Startseite Positionen eintragen (Beschreibung + Bruttobetrag,
   inkl. 19 % MwSt.) und mit „+“ oder Enter hinzufügen.
3. Rechnungsnummer und Zeitraum ausfüllen, dann „Als PDF herunterladen“.

## Projektstruktur

| Datei | Zweck |
| --- | --- |
| `index.html` | Startseite: Positionstabelle, Rechnungsdetails, PDF-Download |
| `script.js` | Logik der Startseite: Tabelle pflegen, localStorage, PDF-Erzeugung |
| `info.html` | Stammdaten-Seite: Absender-/Empfängerdaten |
| `info_script.js` | Logik der Stammdaten-Seite |
| `style.css` | Gesamtes Styling inkl. Light-/Dark-Mode-Farbschema |
| `theme.js` | Setzt/merkt sich Light-/Dark-Mode |
| `frame-guard.js` | Klickjacking-Schutz |
| `manifest.json` | PWA-Manifest (aktuell nicht in den Seiten verlinkt) |

Details zu jeder Datei, dem Datenmodell und den Sicherheitsmaßnahmen: siehe
[DOCUMENTATION.md](./DOCUMENTATION.md).
