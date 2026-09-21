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


function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
}
