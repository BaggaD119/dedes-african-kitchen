(function(){
  var STORAGE_KEY = 'dak-theme';
  var saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch(e){}
  var theme = saved === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);

  function apply(next){
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch(e){}
    document.querySelectorAll('.theme-toggle').forEach(function(btn){
      btn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
    });
  }

  function toggle(){
    var current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    apply(current === 'dark' ? 'light' : 'dark');
  }

  function init(){
    var current = document.documentElement.getAttribute('data-theme') === 'dark';
    document.querySelectorAll('.theme-toggle').forEach(function(btn){
      btn.setAttribute('aria-pressed', current ? 'true' : 'false');
      btn.addEventListener('click', toggle);
    });
  }

  window.DAKTheme = { toggle: toggle, apply: apply };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
