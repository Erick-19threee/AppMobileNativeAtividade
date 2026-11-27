const mensagensFirebase = {
  'auth/email-already-in-use': 'Este e-mail já possui uma conta. Tente entrar.',
  'auth/invalid-email': 'Digite um endereço de e-mail válido.',
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'Não encontramos uma conta com este e-mail.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
  'auth/operation-not-allowed': 'Ative o acesso por e-mail e senha no Firebase Authentication.',
  'auth/network-request-failed': 'Falha de conexão. Verifique a internet e tente novamente.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde um pouco e tente novamente.',
  'permission-denied': 'O Firebase recusou o acesso. Verifique as regras do Firestore.',
  unavailable: 'Firebase temporariamente indisponível. Tente novamente.',
};

export function formatarErroFirebase(erro) {
  return mensagensFirebase[erro?.code] || erro?.message || 'Não foi possível concluir a operação.';
}
