/**
 * Logik der Stammdaten-Seite (info.html): liest/schreibt Absender- und
 * Empfängerdaten aus/in localStorage['infoData']. Wie in script.js gibt es
 * keinen Server — die Daten verlassen den Browser nie von selbst.
 */

// Beim Laden der Seite einmalig aus localStorage gelesen und danach in
// loadInfoData() genutzt, um die Formularfelder vorzubefüllen.
var loadedInfoData = JSON.parse(localStorage.getItem('infoData')) || [];

document.addEventListener('DOMContentLoaded', function() {
    //localStorage.removeItem('infoData');

    loadInfoData();
}, false);


function loadInfoData() {
    /**
     * Befüllt alle Formularfelder mit den zuletzt gespeicherten
     * Stammdaten. Wurde noch nie gespeichert (loadedInfoData ist leer),
     * bleiben die Felder einfach leer.
     *
     * Hinweis: .value setzt reinen Text/keine HTML-Interpretation, ist
     * also unabhängig davon sicher, was zuvor im Feld gespeichert wurde.
     */
    if (loadedInfoData.length === 0) {
        return;
    }
    var firmName = document.getElementById('firmName');
    var senderFirstName = document.getElementById('senderFirstName');
    var senderSurName = document.getElementById('senderSurName');
    var senderAddress = document.getElementById('senderAddress');
    var senderPlz = document.getElementById('senderPlz');
    var senderCity = document.getElementById('senderCity');
    var phone = document.getElementById('phone');
    var strNr = document.getElementById('strNr');
    var mwstNr = document.getElementById('mwstNr');
    var bankName = document.getElementById('bankName');
    var iban = document.getElementById('iban');
    var bic = document.getElementById('bic');


    var recieverName = document.getElementById('recieverName');
    var recieverCity = document.getElementById('recieverCity');
    var recieverAddress = document.getElementById('recieverAddress');
    infoData = loadedInfoData[0];

    firmName.value = infoData['firmName'];
    senderFirstName.value = infoData['senderFirstName'];
    senderSurName.value = infoData['senderSurName'];
    senderAddress.value = infoData['senderAddress'];
    senderPlz.value = infoData['senderPlz'];
    senderCity.value = infoData['senderCity'];
    phone.value = infoData['phone'];
    strNr.value = infoData['strNr'];
    mwstNr.value = infoData['mwstNr'];
    bankName.value = infoData['bankName'];
    iban.value = infoData['iban'];
    bic.value = infoData['bic']
    recieverName.value = infoData['recieverName'];
    recieverCity.value = infoData['recieverCity'];
    recieverAddress.value = infoData['recieverAddress'];

}


function saveDetails() {
    /**
     * Liest alle Formularfelder aus, fasst sie zu einem Objekt zusammen
     * und überschreibt damit localStorage['infoData'] komplett (es wird
     * immer nur ein einziger Datensatz gehalten, kein Verlauf/mehrere
     * Profile). Wird über den "Speichern"-Button aufgerufen.
     */
    var firmName = document.getElementById('firmName').value;
    var senderFirstName = document.getElementById('senderFirstName').value;
    var senderSurName = document.getElementById('senderSurName').value;
    var senderAddress = document.getElementById('senderAddress').value;
    var senderPlz = document.getElementById('senderPlz').value;
    var senderCity = document.getElementById('senderCity').value;
    var phone = document.getElementById('phone').value;
    var strNr = document.getElementById('strNr').value;
    var mwstNr = document.getElementById('mwstNr').value;
    var bankName = document.getElementById('bankName').value;
    var iban = document.getElementById('iban').value;
    var bic = document.getElementById('bic').value;

    var recieverName = document.getElementById('recieverName').value;
    var recieverCity = document.getElementById('recieverCity').value;
    var recieverAddress = document.getElementById('recieverAddress').value;


    var obj = {
        "firmName": firmName,
        "senderFirstName": senderFirstName,
        "senderSurName": senderSurName,
        "senderAddress": senderAddress,
        "senderPlz": senderPlz,
        "senderCity": senderCity,
        "phone": phone,
        "strNr": strNr,
        "mwstNr": mwstNr,
        "bankName": bankName,
        "iban": iban,
        "bic": bic,
        "recieverName": recieverName,
        "recieverCity": recieverCity,
        "recieverAddress": recieverAddress
    }


    loadedInfoData = [obj];

    localStorage.setItem('infoData', JSON.stringify(loadedInfoData));
    window.alert('Erfolgreich gespeichert');
}