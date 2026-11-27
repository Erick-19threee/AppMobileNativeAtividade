import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const configuracaoFirebase = {
  apiKey: "AIzaSyCg_IpeJ_aI8TqMZKYxbTzmgS7mfFD4zPU",
  authDomain: "database-dunkiverse.firebaseapp.com",
  databaseURL: "https://database-dunkiverse-default-rtdb.firebaseio.com",
  projectId: "database-dunkiverse",
  storageBucket: "database-dunkiverse.firebasestorage.app",
  messagingSenderId: "15372309914",
  appId: "1:15372309914:web:99dddfa4198a296d5f5623",
  measurementId: "G-1YDRYQF0KB"
};

export function obterAplicativoFirebase() {
  const camposObrigatorios = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const camposAusentes = camposObrigatorios.filter(
    (campo) => !configuracaoFirebase[campo]
  );

  if (camposAusentes.length > 0) {
    throw new Error(
      'Complete a configuração do Firebase em src/firebase/config.js.'
    );
  }

  return getApps().length > 0
    ? getApp()
    : initializeApp(configuracaoFirebase);
}

export function obterBancoFirebase() {
  return getFirestore(obterAplicativoFirebase());
}
