/**
 * Kernlogik der Startseite (index.html): Positionstabelle pflegen,
 * Positionen in localStorage speichern/laden und daraus per jsPDF eine
 * Rechnung als PDF erzeugen. Es gibt keinen Server/Backend — alles läuft
 * ausschließlich im Browser, Daten liegen nur lokal beim Nutzer.
 */

// In-Memory-Spiegel der in localStorage['myData'] gespeicherten Positionen
// (Array aus {description, amount}); wird von loadData() befüllt und von
// addRow()/deleteRow() synchron zum localStorage-Eintrag gehalten.
var loadedData = []

// Stammdaten (Absender/Empfänger), wie sie info.html unter
// localStorage['infoData'] ablegt. Wird hier nur für die PDF-Erzeugung
// gebraucht, siehe getInfo().
var loadedInfoData = JSON.parse(localStorage.getItem('infoData')) || [];

// Tabelle erst befüllen, wenn das DOM (inkl. der statischen Eingabezeile
// in der Tabelle) vollständig geparst ist.
document.addEventListener('DOMContentLoaded', function() {
    loadData();
}, false);

function loadData() {
    /**
     * Lädt die gespeicherten Positionen aus localStorage['myData'] (leeres
     * Array, falls noch nichts gespeichert wurde) und baut daraus die
     * sichtbaren Tabellenzeilen auf. Wird einmalig beim Laden der Seite
     * aufgerufen.
     */

    loadedData = JSON.parse(localStorage.getItem('myData')) || [];
    let table = document.getElementById("table");
    let newRow
    for (let i = 0; i < loadedData.length; i++) {
        // Die Tabelle hat als letzte Zeile immer die feste Eingabezeile
        // (Textarea + Betragsfeld + "+"-Button aus dem HTML). Neue
        // Positionen müssen deshalb VOR dieser letzten Zeile eingefügt
        // werden, sonst würde die Eingabezeile nach oben "wandern".
        newRow = table.insertRow(table.rows.length - 1);
        let cell1 = newRow.insertCell(0);
        let cell2 = newRow.insertCell(1);
        let cell3 = newRow.insertCell(2)
        let deleteCell = newRow.insertCell(3);

        // Positionsnummer als kleines "Badge" (nur Zahl, daher als
        // vertrauenswürdiges HTML-Fragment unbedenklich).
        cell1.innerHTML = `<span class="pos-badge">${i + 1}</span>`;
        // WICHTIG: textContent statt innerHTML, da Beschreibung/Betrag aus
        // localStorage stammen und theoretisch von einer früheren, vom
        // Nutzer selbst eingegebenen HTML-Injection kompromittiert sein
        // könnten (z. B. wenn die Seite vorher eine XSS-Lücke hatte oder
        // localStorage direkt manipuliert wurde). textContent rendert den
        // Wert immer als reinen Text, nie als ausführbares HTML.
        cell2.textContent = loadedData[i]["description"];
        cell3.textContent = loadedData[i]["amount"];
        cell3.className = 'col-amount';
        deleteCell.innerHTML = deleteButtonHTML();
        deleteCell.className = 'no-border';
    }
}


function deleteButtonHTML() {
    /**
     * Liefert das Markup für den runden Papierkorb-Button, mit dem eine
     * einzelne Position gelöscht wird. Rein statisches, fest verdrahtetes
     * HTML (kein Nutzer-Input darin), daher unbedenklich per innerHTML
     * eingesetzt.
     */
    return '<button class="deleteButton no-border" onclick="deleteRow(this)" aria-label="Position löschen" title="Position löschen"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg></button>';
}


function schließeModal() {
    /**
     * Schließt das "Alles löschen"-Bestätigungsmodal (id="meinModal"),
     * z. B. per Klick auf "Schließen" oder das ×-Symbol.
     */
    document.getElementById("meinModal").style.display = "none";
}


// Schließt das Modal zusätzlich, wenn außerhalb davon (auf den
// abgedunkelten Hintergrund) geklickt wird.
window.onclick = function(event) {
    var modal = document.getElementById("meinModal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
};


function deleteAll() {
    /**
     * Löscht alle gespeicherten Positionen aus localStorage und lädt die
     * Seite neu, damit die (jetzt leere) Tabelle neu aufgebaut wird. Wird
     * über den "Löschen"-Button im Bestätigungsmodal ausgelöst.
     */
    localStorage.removeItem('myData');
    location.reload();
}


function addRow(description, amount) {
    /**
     * Fügt eine neue Zeile für eine Position in die Tabelle ein. Reine
     * DOM-Funktion — sie speichert nichts in localStorage, das übernimmt
     * save() (aufgerufen von addNewRow()).
     *
     * @param {string} description - Beschreibungstext der Position
     * @param {string} amount - fertig formatierter Betrag inkl. "€"
     *   (z. B. "119,00 €"), wie ihn addNewRow() vorbereitet
     */
    let table = document.getElementById("table");
    // Wie in loadData(): immer vor der letzten Zeile (der Eingabezeile)
    // einfügen, damit diese am Ende der Tabelle bleibt.
    let insertIndex = table.rows.length - 1;
    let newRow = table.insertRow(insertIndex);
    // Die Kopfzeile ist Tabellenzeile 0, die erste Position landet also
    // auf Index 1 usw. — insertIndex entspricht damit direkt der
    // fortlaufenden Positionsnummer der neuen Zeile.
    let posCount = insertIndex;

    let cell1 = newRow.insertCell(0);
    let cell2 = newRow.insertCell(1);
    let cell3 = newRow.insertCell(2);
    let deleteCell = newRow.insertCell(3);

    cell1.innerHTML = `<span class="pos-badge">${posCount}</span>`;
    // textContent statt innerHTML: description/amount stammen aus den
    // Eingabefeldern und dürfen nicht als HTML interpretiert werden
    // (verhindert Cross-Site-Scripting über die Positionsbeschreibung).
    cell2.textContent = description;
    cell3.textContent = amount;
    cell3.className = 'col-amount';
    deleteCell.innerHTML = deleteButtonHTML();
    deleteCell.className = 'no-border';
}


function resetInput() {
    /**
     * Leert die Eingabefelder für Beschreibung und Betrag nach dem
     * Hinzufügen einer Position.
     */
    document.getElementById("description").value = "";
    document.getElementById("amount").value = "";
}


function save(description, amount) {
    /**
     * Hängt die neue Position an loadedData an und schreibt das gesamte
     * Array zurück nach localStorage['myData']. Es gibt keine
     * Mehrbenutzer-/Server-Synchronisierung — das ist die einzige
     * "Datenbank" der App.
     */
    loadedData.push({"description": description, "amount": amount});
    localStorage.setItem('myData', JSON.stringify(loadedData));
}


function checkWrongInput(description, amount) {
    /**
     * Validiert Beschreibung und (bereits als Zahl geparsten) Betrag vor
     * dem Hinzufügen einer Position. Gibt bei ungültiger Eingabe true
     * zurück (nachdem ein erklärender Alert angezeigt wurde), sonst
     * undefined (falsy).
     */

    // Betrag muss eine nicht-negative Zahl sein.
    if (amount < 0 || isNaN(amount)) {
        window.alert('Gebe eine Zahl >= 0 ein!');
        // Hinweis: hier stand ursprünglich "True" (großgeschrieben) — das
        // ist in JavaScript kein gültiger Bezeichner und hätte bei jeder
        // fehlgeschlagenen Validierung einen ReferenceError geworfen.
        return true;
    }

    // Beschreibung darf nicht leer sein.
    if (description.length === 0) {
        window.alert('Bitte gebe was in der Beschreibung ein!');
        return true;
    }
}


function addNewRow() {
    /**
     * Handler für den "+"-Button (und Enter im Betragsfeld) der
     * Eingabezeile: liest die Eingabefelder aus, validiert sie, rechnet
     * den eingegebenen Bruttobetrag auf den Nettobetrag (bei 19 % MwSt.)
     * herunter und legt bei gültiger Eingabe eine neue Position an.
     */
    var description = document.getElementById("description").value;
    // Nutzer gibt den Bruttobetrag ein; gespeichert/angezeigt wird der
    // Nettobetrag, da erstelleRechnung() die MwSt. beim PDF-Export separat
    // wieder aufschlägt (siehe calc_sum()/gesamtBrutto dort).
    var amount = Math.round((parseFloat(document.getElementById("amount").value)/1.19)*100)/100;

    if (checkWrongInput(description, amount)) {
        return;
    }

    amount = amount.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €';
    addRow(description, amount);

    resetInput();
    save(description, amount);
}

function anpassenFeld() {
    /**
     * Lässt das Beschreibungs-Textarea automatisch mit dem Inhalt
     * mitwachsen (kein fester Zeilenlimit), statt einen internen
     * Scrollbalken anzuzeigen. Wird bei jedem Tastendruck (oninput)
     * aufgerufen.
     */
    var field = document.getElementById("description");
    field.style.height = "auto";
    field.style.height = (field.scrollHeight) + "px";
}


function erstelleRechnung(daten) {
    /**
     * Baut das eigentliche Rechnungs-PDF mit jsPDF/jsPDF-autoTable auf und
     * stößt den Download an. Alle hier verwendeten doc.text()-Aufrufe
     * schreiben reinen Text in das PDF (kein HTML-Rendering), daher ist
     * das unabhängig von der textContent/innerHTML-Problematik der
     * HTML-Tabelle auf der Seite selbst.
     *
     * @param {[Array, Object]} daten - [0] Zeilen für die Positionstabelle
     *   ([Pos, Beschreibung, Einzelpreis, Anzahl, Gesamtpreis]), [1]
     *   Meta-Infos der Rechnung (Rechnungsnummer, Zeitraum, Datum) — siehe
     *   download().
     */
    // TODO: seperate in different functions and rewrite hardcoded stuff
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    var metaInfo = daten[1];
    daten = daten[0]
    // Absender-/Empfängerdaten aus info.html, siehe getInfo() weiter unten.
    var infoData = getInfo();

    // Kopfzeile (Firmenname + Absendername oben links), wird auf jeder
    // Seite wiederholt (siehe didDrawPage weiter unten).
    function kopfzeile() {
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.text(`${infoData['firmName']}`, 15, 20);
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`${infoData['senderFirstName']} ${infoData['senderSurName']}`, 15, 25)
        doc.setFontSize(10)
    }
    kopfzeile();
    fusszeile();
    // 2. Kasten Links
    doc.setFontSize(8);
    doc.text(`${infoData['firmName']} ${infoData['senderFirstName']} ${infoData['senderSurName']} - ${infoData['senderAddress']} - ${infoData['senderPlz']} ${infoData['senderCity']}`, 15, 45);
    const textWidth = doc.getTextWidth(`${infoData['firmName']} ${infoData['senderFirstName']} ${infoData['senderSurName']} - ${infoData['senderAddress']} - ${infoData['senderPlz']} ${infoData['senderCity']}`);
    doc.line(15, 46, 15 + textWidth, 46)

    // Kundeninformationen
    doc.text(`${infoData['recieverName']}\n${infoData['recieverAddress']}\n${infoData['recieverCity']}`, 15, 55);

    // Oben Rechts. "Mega Möbel Spedition" ist bewusst fest hinterlegter
    // Text (kein Datenfeld) — bitte nicht als Bug missverstehen und
    // entfernen, das ist so gewünscht.
    doc.text(`${infoData['firmName']}\n${infoData['senderFirstName']} ${infoData['senderSurName']}\n${infoData['senderAddress']}\n${infoData['senderPlz']} ${infoData['senderCity']}\n\nMega Möbel Spedition\n\nTelefon: ${infoData['phone']}`, 195, 30, "right");

    // Rechnung übber Tabelle
    doc.setFont(undefined, 'bold');
    doc.setFontSize(24);
    doc.text("Rechnung", 15, 85);
    doc.setFontSize(10);
    doc.text(`Rechnung Nr. ${metaInfo['invoiceNr']}`, 15, 93);
    doc.text(`Datum: ${metaInfo['createDate']}`, 160, 93);

    // Trennlinie
    doc.line(15, 98, 15+175, 98);

    // Textzeile über Tabelle
    doc.setFont(undefined, 'normal');
    doc.text(`Hiermit berechne ich Ihnen meine Dienstleistungen für die Zeit von ${metaInfo['startDate']} - ${metaInfo['endDate']}`, 15, 104);

    // Positionstabelle via jsPDF-autoTable-Plugin (registriert sich selbst
    // auf jsPDF-Instanzen, daher hier als doc.autoTable() verfügbar).
    doc.autoTable({
        columnWidth: 'wrap',
        columnStyles: {
            0: {cellWidth: 10},
            1: {cellWidth: 'auto'},
            2: {cellWidth: 30},
            3: {cellWidth: 20},
            4: {cellWidth: 30},

        },
        bodyStyles: {
            lineWidth: 0.3,
            lineColor: [0, 0, 0],
        },
        theme: 'grid',
        headStyles: {theme: 'grid', fontWeight: "bold", fillColor : [200, 200, 200], lineColor: [0, 0, 0], lineWidth: 0.2, textColor: [0, 0, 0]},
        startY: 110,
        head: [['Pos', 'Beschreibung', 'Einzelpreis', 'Anzahl', 'Gesamtpreis']],
        body: daten,
        margin: { top: 50, bottom:  50},
        didDrawPage: function (data) {
            // Fügt Kopf- und Fußzeile auf jeder neuen Seite hinzu
            if (data.pageCount > 1) {
                doc.setPage(data.pageCount);
                kopfzeile();
                fusszeile();
            }
        },
        styles: {
            overflow: 'linebreak',
            cellWidth: 'wrap',
            overflowColumns: 'linebreak',
            fontSize: 8,
        }
    });

    // Gesamtsumme unterhalb der Tabelle. Falls dafür auf der aktuellen
    // Seite kein Platz mehr ist (Tabelle reicht bis nah ans Seitenende),
    // wird eine neue Seite mit eigener Kopf-/Fußzeile begonnen.
    const finalY = doc.autoTable.previous.finalY;
    let y = doc.internal.pageSize.height - 50;
    if (finalY >= doc.internal.pageSize.height - 50) {
        doc.addPage();
        kopfzeile();
        fusszeile();
        y = doc.internal.pageSize.height - 45;
    } else {
        y = finalY + 5
    }

    // Trennlinie
    doc.line(10, y, 15+185, y);
    let rightMargin = 15;
    
    let gesamtNetto = calc_sum();
    let gesamtBrutto = Math.floor((gesamtNetto * 1.19)*100)/100;
    let gesamtBruttoDiff = Math.floor((gesamtBrutto - gesamtNetto)*100)/100;
    gesamtNetto = gesamtNetto.toLocaleString('de-DE', { minimumFractionDigits: 2 });
    gesamtBrutto = gesamtBrutto.toLocaleString('de-DE',{ minimumFractionDigits: 2 });
    gesamtBruttoDiff = gesamtBruttoDiff.toLocaleString('de-DE',{ minimumFractionDigits: 2 });
    let text = `${gesamtNetto} €`;
    let textSize = doc.getTextWidth(text);
    doc.text(`Nettobetrag:\nzzgl. 19% MwSt:`, 140, y+7);
    doc.text(text, doc.internal.pageSize.width - textSize - rightMargin, y+7);
    text = `${gesamtBruttoDiff} €`;
    textSize = doc.getTextWidth(text);
    doc.text(text, doc.internal.pageSize.width - textSize - rightMargin, y+11);
    doc.setFont(undefined, 'bold');
    doc.text(`Gesamtbetrag:`, 140, y+16);
    text = `${gesamtBrutto} €`;
    textSize = doc.getTextWidth(text);
    doc.text(text, doc.internal.pageSize.width - textSize - rightMargin, y+16);


    // Fußzeile: Absenderadresse, Steuer-/USt-ID sowie Bankverbindung
    // (inkl. IBAN/BIC), wird auf jeder Seite wiederholt.
    function fusszeile() {
        doc.setFontSize(8);
        doc.line(15, doc.internal.pageSize.height - 25, 15+175, doc.internal.pageSize.height - 25)
        doc.text(`${infoData['firmName']}\n${infoData['senderFirstName']} ${infoData['senderSurName']}\n${infoData['senderAddress']}\n${infoData['senderPlz']} ${infoData['senderCity']}`, 15, doc.internal.pageSize.height - 20);

        doc.text(`Steuernummer: ${infoData['strNr']}\nMwst.-Iden-Nr.: ${infoData['mwstNr']}\nInhaber: ${infoData['senderFirstName']} ${infoData['senderSurName']}`, 70, doc.internal.pageSize.height - 20);

        doc.text(`${infoData['bankName']}\nIBAN: ${infoData['iban']}\nBIC: ${infoData['bic']}`, 140, doc.internal.pageSize.height - 20);
    }

    // Summiert die (deutsch formatierten, z. B. "119,00 €") Gesamtpreise
    // aller Positionen zum Nettobetrag der Rechnung.
    // TODO: effizienter machen
    function calc_sum() {
        let sum = 0.0;
        for (let i=0; i<daten.length; i++) {
            let amount = daten[i][2]
            // "€" (letztes Zeichen) abschneiden, dann in eine JS-Zahl
            // umwandeln.
            amount = parseGermanNumber(amount.slice(0, -1));
            if (i == 0) {
                console.log(amount);
            }
            sum += parseFloat(amount);
        }
        return Math.floor(sum*100)/100;
    }

    // Wandelt einen deutsch formatierten Betrag ("1.234,56") in eine für
    // parseFloat() verständliche Zahl ("1234.56") um.
    function parseGermanNumber(germanNumberString) {
        // Entfernt Tausendertrennzeichen (Punkte)
        var withoutThousandsSeparator = germanNumberString.replace(/\./g, '');

        // Ersetzt Komma durch Punkt für Dezimalzahlen
        var normalizedNumberString = withoutThousandsSeparator.replace(/,/g, '.');
    
        // Wandelt die Zeichenkette in eine Zahl um
        return parseFloat(normalizedNumberString);
    }
    const date = new Date();

    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    //save pdf
    doc.save(`Rechnung_${day}_${month}_${year}.pdf`);
}

function download() {
    /**
     * Handler für den "Als PDF herunterladen"-Button: validiert die
     * Rechnungsdetails (Datumsfelder), baut daraus zusammen mit den
     * gespeicherten Positionen die Datenstruktur, die erstelleRechnung()
     * erwartet, und stößt darüber den PDF-Export an.
     */
    // TODO: refactor
    const datePattern = /^\d{2}\.\d{2}\.\d{4}$/;
    let startDate = document.getElementById('startDate').value;
    let endDate = document.getElementById('endDate').value;
    let invoiceNr = document.getElementById('invoiceNr').value;
    let createDate = document.getElementById('createDate').value;
    if (!(datePattern.test(startDate)) || !(datePattern.test(endDate)) || !(datePattern.test(createDate))) {
        window.alert('Gebe ein richtiges Datum an');
        return;
    }
    // data[0]: Tabellenzeilen für autoTable ([Pos, Beschreibung,
    // Einzelpreis, Anzahl, Gesamtpreis] — Anzahl ist hier immer 1, es gibt
    // keine Mengenangabe pro Position). data[1]: Metadaten der Rechnung.
    data = [[], {'startDate': startDate, 'endDate': endDate, 'invoiceNr': invoiceNr, 'createDate': createDate}];
    for (let i = 0; i < loadedData.length; i++) {
        data[0].push([i+1, loadedData[i]['description'], loadedData[i]['amount'], 1, loadedData[i]['amount']])
    }

    erstelleRechnung(data);
}

function deleteRow(btn) {
    /**
     * Entfernt eine einzelne Position: sowohl aus dem loadedData-Array und
     * localStorage als auch die zugehörige Tabellenzeile aus dem DOM.
     * Wird per onclick vom Papierkorb-Button jeder Zeile aufgerufen
     * (this = der geklickte Button).
     */
    var row = btn.parentNode.parentNode; // <button> → <td> → <tr>
    // row.rowIndex zählt ab 0 inkl. Kopfzeile (Zeile 0); die erste
    // Position steht in loadedData[0], aber in Tabellenzeile 1 — daher -1.
    var rowIndex = row.rowIndex - 1;
    loadedData.splice(rowIndex, 1); // Entfernt den Eintrag aus dem Array
    localStorage.setItem('myData', JSON.stringify(loadedData)); // Aktualisiert localStorage
    row.parentNode.removeChild(row); // Entfernt die Zeile aus der Tabelle
}

function getInfo() {
    /**
     * Liest die Absender-/Empfängerdaten aus localStorage['infoData']
     * (wie von info.html/saveDetails() gespeichert). Wurden noch nie
     * Stammdaten gespeichert, dient das untenstehende Objekt als
     * Platzhalter-Beispiel, damit die PDF-Erzeugung nicht mit leeren/
     * undefined-Werten fehlschlägt.
     */
    var loadedInfoData = JSON.parse(localStorage.getItem('infoData')) || [
        {
            'firmName': 'Musterfirma Müller',
            'senderFirstName': "Max",
            'senderSurName': "Mustermann",
            'senderAddress': 'Ringstraße 12',
            'senderPlz': '12345',
            'senderCity': 'Testdorf',
            'phone': '0234 / 500 60 10',
            'email': 'indo@muellertest.de',
            'strNr': '12345-12345',
            'mwstNr': 'DE 123456789',
            'bankName': 'Musterank Musterstadt',
            'iban': 'DE12 1234 1234 1234 1234 12',
            'bic': 'ABCDEFGHIJK',
            'recieverName': 'Max Mustermann',
            'recieverAddress': 'Musterstr: 12',
            'recieverCity': 'Musterhause',
        }
    ];

    infoData = loadedInfoData[0];
    return infoData;
}