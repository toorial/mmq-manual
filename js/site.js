document.addEventListener("DOMContentLoaded", function () {
  var form = document.getElementById("user-login-form");
  if (!form) return;
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var name = document.getElementById("edit-name").value.trim();
    var pass = document.getElementById("edit-pass").value;
    var box = document.getElementById("login-msg");
    if (name === "admin" && pass === "1") {
      box.className = "messages";
      box.textContent = "Initial desktop account from the manual: admin / 1. This form only checks that pair. Measurement still runs in MMQ Determination Software.exe on Windows.";
    } else {
      box.className = "messages error";
      box.textContent = "Unrecognized username or password.";
    }
  });
});
