(function () {
  var m = 'provider destroyed';
  function isProviderDestroyed(r) {
    return (
      r === m ||
      (typeof r === 'string' && r.indexOf(m) !== -1) ||
      (r && r.message && r.message.indexOf(m) !== -1)
    );
  }
  window.addEventListener(
    'unhandledrejection',
    function (e) {
      if (!isProviderDestroyed(e.reason)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    },
    true,
  );
})();
