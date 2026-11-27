import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { obterAplicativoFirebase } from './config';

function obterAutenticacao() {
  return getAuth(obterAplicativoFirebase());
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
