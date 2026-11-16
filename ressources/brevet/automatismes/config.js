/* GiroMaths – configuration de l'enregistrement des résultats.
   Colle entre les guillemets l'adresse de ton application Web Google Apps Script
   (elle se termine par /exec). Laisse vide pour ne rien enregistrer. */
window.GIRO_CONFIG = {
  endpoint: "https://script.google.com/macros/s/AKfycbxaz5HAwC7yorN33ElYyYnHAIzmEdQgwhEmymQOGLgGKtFY89wGFdNzicSGHrDkmOiQgg/exec",
  // Code demandé pour le « Mode professeur ». Seule son empreinte SHA-256 est rangée ici, pas le code lui-même.
  // Pour changer de code : python3 -c "import hashlib;print(hashlib.sha256('NOUVEAU-CODE'.encode()).hexdigest())"
  codeProfHash: "e2b9489a0fd877d994d315abfc17e6972455bf0806229ce0776a8446fea60130"
};
