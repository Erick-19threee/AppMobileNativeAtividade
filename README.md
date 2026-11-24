# Vitrine Mobile — loja virtual em React Native

Guia para criar no **Expo Snack** um aplicativo de loja virtual com **React Native**. O catálogo de produtos será mantido localmente no próprio app, sem depender de APIs externas de produtos. No checkout, a API pública **ViaCEP** será usada somente para preencher o endereço de entrega a partir do CEP informado pelo comprador.

> Personalize o nome, o visual, as categorias, os produtos e o conteúdo para criar uma experiência original. Não copie a identidade de uma loja existente.

## Funcionalidades previstas

- Vitrine com busca, categorias e poucos produtos cadastrados localmente.
- Imagens, preços e descrições dos produtos, além de uma tela de detalhes.
- Carrinho de compras e favoritos.
- Checkout com CEP, endereço de entrega e preenchimento automático via ViaCEP.
- Validação de campos e mensagens para CEP inválido, não encontrado ou falha de conexão.
- Layout adaptável a diferentes tamanhos de tela e à rotação.

## 1. Crie o app no Expo Snack

1. Acesse [snack.expo.dev](https://snack.expo.dev/) e entre com sua conta Expo.
2. Crie um Snack novo e escolha um template React Native.
3. Edite `App.js` ou `App.tsx`, conforme o template escolhido.
4. Para usar somente o catálogo local e a consulta de CEP, não é necessário instalar uma dependência de API de produtos. Se decidir salvar carrinho ou favoritos na nuvem, configure o Firebase conforme a seção 5.
5. Abra a prévia web ou escaneie o QR code com o Expo Go. Confira as dependências e limitações atuais do Snack antes de adicionar bibliotecas.

Salve o Snack na sua conta e use a opção de compartilhar para enviar o link do projeto. Faça cópias/versões durante o desenvolvimento para não perder alterações.

## 2. Organize o código

O protótipo pode começar em um único arquivo. Conforme crescer, separe as responsabilidades:

```text
App.js
src/
├── data/              # Catálogo local de produtos
├── components/        # Cartões, busca, formulário e mensagens
├── screens/           # Vitrine, detalhes, carrinho e checkout
├── services/          # Consulta de CEP via ViaCEP
└── firebase/          # Persistência opcional de carrinho/favoritos
```

Mantenha os dados dos produtos, a interface, a consulta de CEP e a persistência separados para facilitar testes e manutenção.

## 3. Cadastre os produtos localmente

Como o catálogo terá poucos itens e imagens, mantenha os produtos em um arquivo do projeto, por exemplo `src/data/products.js`. Use imagens locais ou URLs próprias sob seu controle; não faça chamadas a uma API externa para carregar produtos.

```js
export const products = [
  {
    id: 'produto-1',
    title: 'Camiseta básica',
    description: 'Camiseta confortável para o dia a dia.',
    price: 59.9,
    image: require('../../assets/camiseta.jpg'),
    category: 'Roupas',
  },
  {
    id: 'produto-2',
    title: 'Caneca',
    description: 'Caneca para café ou chá.',
    price: 29.9,
    image: require('../../assets/caneca.jpg'),
    category: 'Acessórios',
  },
];
```

Ajuste os caminhos de imagem à estrutura do seu projeto. Para exibir imagens com `require`, os caminhos precisam ser estáticos e conhecidos durante a compilação. Se preferir usar URLs de imagens próprias, use o componente `Image` com `uri`.

Formate valores em reais:

```js
const precoFormatado = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(product.price);
```

Use `FlatList` para mostrar os produtos. Com poucos itens, não é necessário implementar paginação ou carregamento incremental. A busca e os filtros de categoria podem ser feitos em memória, a partir do array local.

## 4. Consulte o CEP no checkout com ViaCEP

No checkout, peça o CEP do comprador e, após validar os oito dígitos, consulte `https://viacep.com.br/ws/{CEP}/json/`. O exemplo abaixo preenche logradouro, bairro, cidade e estado. Número e complemento devem ser informados pelo comprador, pois a consulta não os determina.

```js
async function buscarEnderecoPorCep(cepInformado) {
  const cep = cepInformado.replace(/\D/g, '');

  if (cep.length !== 8) {
    throw new Error('Digite um CEP com 8 números.');
  }

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!response.ok) {
    throw new Error('Não foi possível consultar o CEP. Tente novamente.');
  }

  const endereco = await response.json();
  if (endereco.erro) {
    throw new Error('CEP não encontrado. Confira os números e tente novamente.');
  }

  return {
    cep: endereco.cep || cep,
    logradouro: endereco.logradouro || '',
    bairro: endereco.bairro || '',
    cidade: endereco.localidade || '',
    estado: endereco.uf || '',
  };
}
```

Exemplo de uso no componente React Native:

```js
const [cep, setCep] = useState('');
const [endereco, setEndereco] = useState(null);
const [consultandoCep, setConsultandoCep] = useState(false);
const [erroCep, setErroCep] = useState('');

async function preencherEndereco() {
  setErroCep('');
  setConsultandoCep(true);
  try {
    const dados = await buscarEnderecoPorCep(cep);
    setEndereco(dados);
  } catch (error) {
    setEndereco(null);
    setErroCep(error.message || 'Falha ao consultar o CEP. Verifique sua conexão.');
  } finally {
    setConsultandoCep(false);
  }
}
```

Associe os valores de `endereco` aos campos editáveis do formulário. Permita que o comprador corrija os dados preenchidos automaticamente e informe número, complemento e outros dados necessários para a entrega. Trate também erros de rede e ofereça a opção de tentar novamente. A API não deve receber dados do pedido além do CEP consultado.

## 5. Carrinho, favoritos e persistência

O carrinho pode ser mantido em estado enquanto o app estiver aberto ou salvo localmente no dispositivo. Favoritos e itens do carrinho podem também ser gravados no Firebase Cloud Firestore, se a atividade exigir persistência entre sessões ou usuários. Não é necessário usar Firebase para consultar o catálogo local nem para buscar CEP.

Se optar pelo Firebase:

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/) e adicione um app Web.
2. Habilite o provedor de autenticação escolhido e configure o Cloud Firestore.
3. Instale e configure a dependência `firebase` no projeto.
4. Use regras do Firestore que restrinjam a leitura e a gravação aos dados do usuário autenticado. Nunca use regras abertas em um app publicado e não coloque credenciais privadas no cliente.

Ao salvar carrinho ou favoritos, guarde apenas os campos necessários, como identificador, nome, preço, imagem e quantidade. O catálogo continua vindo do arquivo local do app.

## 6. Telas e experiência da loja

A vitrine deve apresentar a identidade visual da loja, busca, categorias e cartões com imagem, nome e preço. Ao selecionar um produto, exiba detalhes e permita adicioná-lo ao carrinho ou aos favoritos. No carrinho, permita alterar quantidades e remover itens; no checkout, apresente resumo do pedido e formulário de entrega.

Use estados visuais para carregamento, erro, lista vazia e sucesso. Evite iniciar outra consulta de CEP enquanto uma consulta estiver em andamento. Dimensione as imagens para os cartões, use placeholder/fallback para imagens ausentes e teste diferentes tamanhos de tela e orientação.

## 7. Testes

Valide estes cenários no Snack e no Expo Go:

- A vitrine carrega os produtos definidos localmente e as imagens aparecem.
- Busca e filtros funcionam sem chamadas a APIs de produtos.
- Detalhes, favoritos, quantidades e remoção de itens do carrinho funcionam.
- Um CEP válido preenche logradouro, bairro, cidade e estado.
- CEP com menos ou mais de oito dígitos é rejeitado antes da consulta.
- CEP inexistente, falha de rede e resposta inválida mostram mensagens claras.
- Número e complemento podem ser preenchidos e editados pelo comprador.
- O formulário funciona em diferentes tamanhos de tela e orientação.
- Se usar Firestore, as regras impedem acesso aos dados de outro usuário.

## 8. Entrega

Salve o projeto no Snack e compartilhe o link, conforme solicitado pela disciplina. Se também for entregar o código ZIP, inclua os arquivos do projeto e instruções para executar, sem dependências instaladas desnecessárias. Inclua os integrantes, funcionalidades implementadas, instruções de uso e evidências dos testes. Não invente resultados de performance.

## Referências

- [Expo Snack](https://snack.expo.dev/)
- [Documentação do Expo](https://docs.expo.dev/)
- [Documentação da API ViaCEP](https://viacep.com.br/)
- [Firebase para JavaScript](https://firebase.google.com/docs/web/setup)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- [Regras de segurança do Firestore](https://firebase.google.com/docs/firestore/security/get-started)
- [React Native — FlatList](https://reactnative.dev/docs/flatlist)
