import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {
  autenticarUsuarioFirebase,
  criarContaFirebase,
  encerrarSessaoFirebase,
  observarSessaoFirebase,
} from './autenticacao';
import { obterBancoFirebase } from './config';

function obterDocumentoEstadoCompra(idUsuario) {
  const banco = obterBancoFirebase();
  return doc(banco, 'usuarios', idUsuario, 'dados', 'estadoCompra');
}

function obterDocumentoUsuario(idUsuario) {
  return doc(obterBancoFirebase(), 'usuarios', idUsuario);
}

export async function garantirPerfilUsuarioFirebase(usuario) {
  const documentoUsuario = obterDocumentoUsuario(usuario.uid);
  const perfilSalvo = await getDoc(documentoUsuario);
  if (perfilSalvo.exists()) return;

  await setDoc(documentoUsuario, {
    uid: usuario.uid,
    nome: usuario.displayName || usuario.email?.split('@')[0] || 'Cliente',
    email: usuario.email,
    criadoEm: serverTimestamp(),
  });
}

export async function inicializarFirebase() {
  obterBancoFirebase();
}

export function observarAutenticacaoFirebase(aoAlterarSessao) {
  return observarSessaoFirebase(aoAlterarSessao);
}

export async function cadastrarUsuarioFirebase(nome, email, senha) {
  const usuario = await criarContaFirebase(nome.trim(), email.trim(), senha);
  await garantirPerfilUsuarioFirebase(usuario);
  return usuario;
}

export async function entrarUsuarioFirebase(email, senha) {
  const usuario = await autenticarUsuarioFirebase(email.trim(), senha);
  await garantirPerfilUsuarioFirebase(usuario);
  return usuario;
}

export async function sairUsuarioFirebase() {
  await encerrarSessaoFirebase();
}

export async function carregarEstadoCompraFirebase(idUsuario) {
  const documento = obterDocumentoEstadoCompra(idUsuario);
  const snapshot = await getDoc(documento);

  if (!snapshot.exists()) {
    return { carrinho: [], favoritos: [] };
  }

  const estadoSalvo = snapshot.data();
  return {
    carrinho: Array.isArray(estadoSalvo.carrinho) ? estadoSalvo.carrinho : [],
    favoritos: Array.isArray(estadoSalvo.favoritos) ? estadoSalvo.favoritos : [],
  };
}

export async function salvarEstadoCompraFirebase(idUsuario, estadoCompra) {
  const documento = obterDocumentoEstadoCompra(idUsuario);
  await setDoc(documento, {
    carrinho: estadoCompra.carrinho,
    favoritos: estadoCompra.favoritos,
    atualizadoEm: serverTimestamp(),
  });
}

export async function registrarPedidoFirebase(idUsuario, itens, enderecoEntrega) {
  const banco = obterBancoFirebase();
  await addDoc(collection(banco, 'usuarios', idUsuario, 'pedidos'), {
    itens,
    enderecoEntrega,
    criadoEm: serverTimestamp(),
  });
}
