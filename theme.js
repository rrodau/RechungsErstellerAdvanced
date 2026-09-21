(function () {
    /**
     * Setzt das Farbschema so früh wie möglich (noch vor dem ersten Rendern),
     * damit es beim Laden nicht kurz im falschen Modus aufblitzt.
     */
    function getPreferredTheme() {
        var stored = localStorage.getItem('theme');
        if (stored === 'light' || stored === 'dark') {
            return stored;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', getPreferredTheme());
})();


/**
 * Wechselt zwischen Light- und Dark-Mode und merkt sich die Wahl in
 * localStorage['theme'], sodass sie beim nächsten Besuch (auf beiden
 * Seiten, index.html wie info.html) automatisch wieder greift — unabhängig
 * von der Systemeinstellung. Wird vom Sonne/Mond-Button im Header
 * aufgerufen.
 */
function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
}
