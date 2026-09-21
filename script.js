
var loadedData = []
var loadedInfoData = JSON.parse(localStorage.getItem('infoData')) || [];

// fetch info directly after loading the page
document.addEventListener('DOMContentLoaded', function() {
    loadData();
}, false);

function loadData() {
    /**
     * A function which gets the data saved in localStorage under 'myData' or
     * an empty list if there is no data
     * and fills the table with the values
     */

    loadedData = JSON.parse(localStorage.getItem('myData')) || [];
    let table = document.getElementById("table");
    let newRow
    for (let i = 0; i < loadedData.length; i++) {
        // wird immer direkt vor der Eingabezeile (letzte Zeile) eingefügt
        newRow = table.insertRow(table.rows.length - 1);
        let cell1 = newRow.insertCell(0);
        let cell2 = newRow.insertCell(1);
        let cell3 = newRow.insertCell(2)
        let deleteCell = newRow.insertCell(3);

        cell1.innerHTML = `<span class="pos-badge">${i + 1}</span>`;
        cell2.innerHTML = loadedData[i]["description"];
        cell3.innerHTML = loadedData[i]["amount"];
        deleteCell.innerHTML = deleteButtonHTML();
        deleteCell.className = 'no-border';
    }
}


function deleteButtonHTML() {
    /**
     * Returns the markup for the round trash-icon button used to
     * delete a single position row
     */
    return '<button class="deleteButton no-border" onclick="deleteRow(this)" aria-label="Position löschen" title="Position löschen"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg></button>';
}


// closes the modal
function schließeModal() {
    /**
     * A function which closes the modal with id='meinModal' 
     * after the button was clicked
     */
    document.getElementById("meinModal").style.display = "none";
}


window.onclick = function(event) {
    /**
     * A function which closes the modal with id='meinModal'
     * after the outside of the modal was clicked
     */
    var modal = document.getElementById("meinModal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
};


function deleteAll() {
    /**
     * A function which deletes all positions data from localStorage
     */
    // deletes the data
    localStorage.removeItem('myData');

    // Löscht alle Einträge in localStorage
    // localStorage.clear();

    // refreshes the page so the table is empty
    location.reload();
}


function addRow(description, amount) {
    /**
     * A function which adds a new Row to the table after the 'hinzufügen' 
     * button is clicked
     * @param
     * 
     */
    let table = document.getElementById("table");
    // wird immer direkt vor der Eingabezeile (letzte Zeile) eingefügt
    let insertIndex = table.rows.length - 1;
    let newRow = table.insertRow(insertIndex);
    let posCount = insertIndex; // Kopfzeile ist Zeile 0, daher entspricht der Index der neuen Position

    let cell1 = newRow.insertCell(0);
    let cell2 = newRow.insertCell(1);
    let cell3 = newRow.insertCell(2);
    let deleteCell = newRow.insertCell(3);

    cell1.innerHTML = `<span class="pos-badge">${posCount}</span>`;
    cell2.innerHTML = description;
    cell3.innerHTML = amount;
    deleteCell.innerHTML = deleteButtonHTML();
    deleteCell.className = 'no-border';
}


function resetInput() {
    /**
     * A function which resets the Inputfields for a new row
     */
    document.getElementById("description").value = "";
    document.getElementById("amount").value = "";
}


function save(description, amount) {
    /**
     * A function which saves the new added row in
     * localStorage
     */
    loadedData.push({"description": description, "amount": amount});
    localStorage.setItem('myData', JSON.stringify(loadedData));
}


function checkWrongInput(description, amount) {
    // checks if the amount is correctly inserted
    if (amount < 0 || isNaN(amount)) {
        window.alert('Gebe eine Zahl >= 0 ein!');
        return True;
    }

    // checks if the description is correctly inserted
    if (description.length === 0) {
        window.alert('Bitte gebe was in der Beschreibung ein!');
        return True;
    }
} 


function addNewRow() {
    var description = document.getElementById("description").value;
    var amount = Math.round((parseFloat(document.getElementById("amount").value)/1.19)*100)/100;

    // checks if the amount is correctly inserted
    if (checkWrongInput(description, amount)) {
        return;
    }

    amount = amount.toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €';
    // calls function to add the row
    addRow(description, amount);

    // reset Inputfields and save
    resetInput();
    save(description, amount);
}

function anpassenFeld() {
    var field = document.getElementById("description");
    field.style.height = "auto";
    field.style.height = (field.scrollHeight) + "px";
}


function erstelleRechnung(daten) {
    // TODO: seperate in different functions and rewrite hardcoded stuff
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    var metaInfo = daten[1];
    daten = daten[0]
    var infoData = getInfo();

    // Kopfzeile
    // Oben Links
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

    // Oben Rechts some is hardcoded
    doc.text(`${infoData['firmName']}\n${infoData['senderFirstName']} ${infoData['senderSurName']}\n
    ${infoData['senderAddress']}\n${infoData['senderPlz']} ${infoData['senderCity']}
    \n\nMega Möbel Spedition
    \n\nTelefon: ${infoData['phone']}`, 195, 30, "right");

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

    // Tabelle
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

    // Gesmatsumme
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


    // Fußzeile
    function fusszeile() {
        doc.setFontSize(8);
        doc.line(15, doc.internal.pageSize.height - 25, 15+175, doc.internal.pageSize.height - 25)
        doc.text(`${infoData['firmName']}\n${infoData['senderFirstName']} ${infoData['senderSurName']}\n${infoData['senderAddress']}\n${infoData['senderPlz']} ${infoData['senderCity']}`, 15, doc.internal.pageSize.height - 20);

        doc.text(`Steuernummer: ${infoData['strNr']}\nMwst.-Iden-Nr.: ${infoData['mwstNr']}\nInhaber: ${infoData['senderFirstName']} ${infoData['senderSurName']}`, 70, doc.internal.pageSize.height - 20);

        doc.text(`${infoData['bankName']}\nIBAN: ${infoData['iban']}\nBIC: ${infoData['BIC']}`, 140, doc.internal.pageSize.height - 20);
    }

    // TODO: effizienter machen
    function calc_sum() {
        let sum = 0.0;
        for (let i=0; i<daten.length; i++) {
            let amount = daten[i][2]
            amount = parseGermanNumber(amount.slice(0, -1));
            if (i == 0) {
                console.log(amount);
            }
            sum += parseFloat(amount);
        }
        return Math.floor(sum*100)/100;
    }

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
    data = [[], {'startDate': startDate, 'endDate': endDate, 'invoiceNr': invoiceNr, 'createDate': createDate}];
    for (let i = 0; i < loadedData.length; i++) {
        data[0].push([i+1, loadedData[i]['description'], loadedData[i]['amount'], 1, loadedData[i]['amount']])
    }
    
    erstelleRechnung(data);
}

function deleteRow(btn) {
    var row = btn.parentNode.parentNode;
    var rowIndex = row.rowIndex - 1; // da `insertRow(-1)` verwendet wurde
    loadedData.splice(rowIndex, 1); // Entfernt den Eintrag aus dem Array
    localStorage.setItem('myData', JSON.stringify(loadedData)); // Aktualisiert localStorage
    row.parentNode.removeChild(row); // Entfernt die Zeile aus der Tabelle
}

function getInfo() {
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