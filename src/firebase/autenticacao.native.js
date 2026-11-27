import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createUserWithEmailAndPassword,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { obterAplicativoFirebase } from './config';

let autenticacao;

function obterAutenticacao() {
  if (autenticacao) return autenticacao;

  const aplicativo = obterAplicativoFirebase();
  try {
    autenticacao = initializeAuth(aplicativo, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (erro) {
    if (erro.code !== 'auth/already-initialized') throw erro;
    autenticacao = getAuth(aplicativo);
  }
  return autenticacao;
}

export function observarSessaoFirebase(aoAlterarSessao) {
  return onAuthStateChanged(obterAutenticacao(), aoAlterarSessao);
}

export async function criarContaFirebase(nome, email, senha) {
  const credencial = await createUserWithEmailAndPassword(
    obterAutenticacao(),
    email,
    senha
  );
  await updateProfile(credencial.user, { displayName: nome });
  return credencial.user;
}

export async function autenticarUsuarioFirebase(email, senha) {
  const credencial = await signInWithEmailAndPassword(
    obterAutenticacao(),
    email,
    senha
  );
  return credencial.user;
}

export async function encerrarSessaoFirebase() {
  await signOut(obterAutenticacao());
}
