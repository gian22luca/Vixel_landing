(function () {
  var form = document.getElementById("login-form");
  var errorBox = document.getElementById("login-error");
  var btn = document.getElementById("login-btn");

  // Si ya hay un token vigente, no tiene sentido mostrar el login de nuevo.
  var token = VixelAuth.getAccessToken();
  if (token) {
    var params = new URLSearchParams(location.search);
    location.href = params.get("volver") || "/panel/";
    return;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    errorBox.hidden = true;
    btn.disabled = true;
    btn.textContent = "Ingresando...";

    var username = document.getElementById("username").value.trim();
    var password = document.getElementById("password").value;

    try {
      await VixelAuth.login(username, password);
      var params = new URLSearchParams(location.search);
      location.href = params.get("volver") || "/panel/";
    } catch (err) {
      errorBox.textContent = err.message || "No se pudo iniciar sesión.";
      errorBox.hidden = false;
      btn.disabled = false;
      btn.textContent = "Ingresar";
    }
  });
})();
