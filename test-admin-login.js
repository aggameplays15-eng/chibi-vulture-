// Script de test pour vérifier la connexion admin
const fetch = require('node-fetch');

const testAdminLogin = async () => {
  console.log('🔐 Test de connexion admin...\n');

  const credentials = {
    email: 'papicamara22@gmail.com',
    password: 'fantasangare2203'
  };

  try {
    const response = await fetch('http://localhost:5173/api/admin-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Connexion admin réussie !');
      console.log('📧 Email:', data.user.email);
      console.log('👤 Nom:', data.user.name);
      console.log('🎭 Rôle:', data.user.role);
      console.log('🔑 Token:', data.token.substring(0, 20) + '...');
    } else {
      console.log('❌ Échec de connexion');
      console.log('Erreur:', data.error);
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.log('\n⚠️  Assurez-vous que le serveur de développement est lancé (npm run dev)');
  }
};

testAdminLogin();
