(function () {
    /**
     * Best-effort Klickjacking-Schutz.
     *
     * X-Frame-Options und die CSP-Direktive frame-ancestors lassen sich nur
     * per HTTP-Header setzen (nicht per <meta>), und diese statische Seite
     * hat keine eigene Serverkonfiguration, über die das ginge.
     *
     * Klassisches "Frame-Busting" per window.top.location-Umleitung wird von
     * aktuellen Browsern ohne Nutzerinteraktion blockiert ("Unsafe attempt to
     * initiate navigation ..."), ist also kein verlässlicher Schutz mehr.
     * Stattdessen wird hier nur das eigene Dokument markiert; style.css
     * blendet darüber den gesamten Seiteninhalt aus und zeigt nur einen
     * Warnhinweis, sodass eingebettete Inhalte für Klickjacking unbrauchbar
     * werden.
     */
    if (window.top !== window.self) {
        document.documentElement.setAttribute('data-framed', 'true');
    }
})();
