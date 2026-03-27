// Dark-Mode sofort anwenden (vor Vue-Mount, verhindert Flicker)
// Default: Dark — nur bei explizitem "light" wird Dark entfernt
(function () {
  var c = (document.cookie.match(/(?:^|;\s*)fw_theme=(\w+)/) || [])[1];
  var t = c || localStorage.getItem("darkMode");
  var d = t ? t === "dark" || t === "true" : true;
  if (d) document.documentElement.classList.add("dark");
})();
