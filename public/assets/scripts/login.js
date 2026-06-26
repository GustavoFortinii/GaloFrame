document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const btn = document.querySelector('.login-btn');
  btn.disabled = true;

  try {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    // Guarda o Token JWT de segurança e o nome do Atleticano
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', data.username);

    // Redireciona para a página interna
    window.location.href = "/home";
  } catch (error) {
    alert(error.message || "Erro ao realizar login.");
    btn.disabled = false;
  }
});