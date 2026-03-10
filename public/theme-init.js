// Dark-Mode sofort anwenden (vor Vue-Mount, verhindert Flicker)
(function(){
  var c = (document.cookie.match(/(?:^|;\s*)fw_theme=(\w+)/) || [])[1];
  var d = c ? c === 'dark' : localStorage.getItem('darkMode') === 'true';
  if (d) document.documentElement.classList.add('dark');
})();
