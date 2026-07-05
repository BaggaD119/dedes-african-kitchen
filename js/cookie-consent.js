(function(){
  var STORAGE_KEY = 'dak-cookie-consent';
  function inject(){
    var already = null;
    try { already = localStorage.getItem(STORAGE_KEY); } catch(e){}
    if(already) return;

    var bar = document.createElement('div');
    bar.className = 'cookie-consent';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Cookie notice');
    bar.innerHTML =
      '<p>We use cookies to keep you signed in and improve your experience. See our <a href="privacy.html">Privacy Policy</a>.</p>' +
      '<div class="cookie-actions"><button type="button" class="cookie-accept">Accept</button></div>';
    document.body.appendChild(bar);

    bar.querySelector('.cookie-accept').addEventListener('click', function(){
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch(e){}
      bar.remove();
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();
