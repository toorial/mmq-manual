(function () {
  var params = new URLSearchParams(window.location.search);
  var q = (params.get("keys") || "").trim();
  var box = document.getElementById("edit-keys");
  if (box && q) box.value = q;
  var summary = document.getElementById("search-summary");
  var results = document.getElementById("search-results");
  if (!summary || !results) return;
  var pages = window.MMQ_INDEX || [];
  if (!q) {
    summary.textContent = "Type a word in the box above and choose Search.";
    return;
  }
  var needle = q.toLowerCase();
  var hits = [];
  pages.forEach(function (page) {
    var hay = (page.title + " " + page.text).toLowerCase();
    if (hay.indexOf(needle) === -1) return;
    var plain = page.text;
    var at = plain.toLowerCase().indexOf(needle);
    var start = Math.max(0, at - 80);
    var end = Math.min(plain.length, at + needle.length + 140);
    var snippet = (start > 0 ? "…" : "") + plain.slice(start, end) + (end < plain.length ? "…" : "");
    hits.push({ title: page.title, url: page.url, snippet: snippet });
  });
  summary.textContent = hits.length
    ? hits.length + (hits.length === 1 ? " result" : " results") + " for “" + q + "”."
    : "No results for “" + q + "”.";
  function esc(s) {
    return s.replace(/[&<>"]/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch];
    });
  }
  function mark(s) {
    var safe = esc(s);
    var re = new RegExp("(" + needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
    return safe.replace(re, "<mark>$1</mark>");
  }
  results.innerHTML = hits.map(function (hit) {
    return '<div class="search-hit"><h2><a href="' + esc(hit.url) + '">' + esc(hit.title) + '</a></h2><p>' + mark(hit.snippet) + '</p></div>';
  }).join("");
})();
