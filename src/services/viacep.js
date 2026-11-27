export async function consultarEnderecoPorCep(cepDigitado) {
  const cepNumerico = String(cepDigitado || '').replace(/\D/g, '');

  if (cepNumerico.length !== 8) {
    throw new Error('Digite um CEP com 8 números.');
  }

  let resposta;
  try {
    resposta = await fetch(`https://viacep.com.br/ws/${cepNumerico}/json/`);
  } catch {
    throw new Error('Falha ao consultar o CEP. Verifique sua conexão.');
  }

  if (!resposta.ok) {
    throw new Error('Não foi possível consultar o CEP. Tente novamente.');
  }

  let dadosEndereco;
  try {
    dadosEndereco = await resposta.json();
  } catch {
    throw new Error('A resposta do serviço de CEP é inválida.');
  }

  if (dadosEndereco.erro) {
    throw new Error('CEP não encontrado. Confira os números e tente novamente.');
  }

  return {
    cep: dadosEndereco.cep || cepNumerico,
    logradouro: dadosEndereco.logradouro || '',
    bairro: dadosEndereco.bairro || '',
    cidade: dadosEndereco.localidade || '',
    estado: dadosEndereco.uf || '',
  };
}
