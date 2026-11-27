# Vitrine Mobile — loja virtual em React Native

Guia para criar um aplicativo de loja virtual com **React Native** e Expo. O catálogo de produtos é local; carrinho, favoritos e pedidos são persistidos no **Firebase Cloud Firestore**. No checkout, a API pública **ViaCEP** é usada somente para preencher o endereço a partir do CEP informado pelo comprador.

> Personalize o nome, o visual, as categorias, os produtos e o conteúdo para criar uma experiência original. Não copie a identidade de uma loja existente.

## Funcionalidades previstas

- Vitrine com busca, categorias e poucos produtos cadastrados localmente.
- Imagens, preços e descrições dos produtos, além de uma tela de detalhes.
- Carrinho de compras e favoritos.
- Cadastro e login com e-mail e senha; perfil do cliente salvo no Firestore.
- Checkout com CEP, endereço de entrega e preenchimento automático via ViaCEP.
- Validação de campos e mensagens para CEP inválido, não encontrado ou falha de conexão.
- Layout adaptável a diferentes tamanhos de tela e à rotação.

## 1. Crie o app no Expo Snack

1. Acesse [snack.expo.dev](https://snack.expo.dev/) e entre com sua conta Expo.
2. Crie um Snack novo e escolha um template React Native.
3. Edite `App.js` ou `App.tsx`, conforme o template escolhido.
4. Configure Firebase Authentication e Cloud Firestore conforme a seção 5; o catálogo continua local e o ViaCEP é usado no checkout.
5. Abra a prévia web ou escaneie o QR code com o Expo Go. Confira as dependências e limitações atuais do Snack antes de adicionar bibliotecas.

Salve o Snack na sua conta e use a opção de compartilhar para enviar o link do projeto. Faça cópias/versões durante o desenvolvimento para não perder alterações.

## 2. Organize o código

O protótipo pode começar em um único arquivo. Conforme crescer, separe as responsabilidades:

```text
App.js
src/
├── components/        # Cabeçalho, cartões, estados vazios e detalhes do produto
├── data/              # Catálogo local de produtos
├── screens/           # Vitrine, carrinho e checkout
├── firebase/          # Configuração, autenticação e acesso ao Firestore
├── services/          # Consulta de CEP via ViaCEP
├── utils/             # Formatação de preços
└── theme.js           # Cores compartilhadas
```

A navegação e o estado compartilhado ficam em `App.js`. A configuração Firebase está em `src/firebase/config.js`, a autenticação em `src/firebase/autenticacao.*.js` e o acesso ao Firestore em `src/firebase/loja.js`.

## 3. Cadastre os produtos localmente

Como o catálogo terá poucos itens e imagens, mantenha os produtos em um arquivo do projeto, por exemplo `src/data/products.js`. Use imagens locais ou URLs próprias sob seu controle; não faça chamadas a uma API externa para carregar produtos. As imagens de demonstração usam os parâmetros de transformação do CDN do Unsplash para entregar imagens redimensionadas e com qualidade reduzida (`w=640&q=75`).

```js
export const produtos = [
  {
    id: 'produto-1',
    nome: 'Camiseta básica',
    descricao: 'Camiseta confortável para o dia a dia.',
    preco: 59.9,
    imagem: require('../../assets/camiseta.jpg'),
    categoria: 'Roupas',
  },
  {
    id: 'produto-2',
    nome: 'Caneca',
    descricao: 'Caneca para café ou chá.',
    preco: 29.9,
    imagem: require('../../assets/caneca.jpg'),
    categoria: 'Acessórios',
  },
];
```

Ajuste os caminhos de imagem à estrutura do seu projeto. Para exibir imagens com `require`, os caminhos precisam ser estáticos e conhecidos durante a compilação. Se preferir usar URLs de imagens próprias, use o componente `Image` com `uri`.

Formate valores em reais:

```js
const precoFormatado = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(produto.preco);
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

O app usa Firebase Authentication com e-mail e senha. Ao concluir o cadastro, cria também o documento `usuarios/{uid}` no Firestore com nome, e-mail e data de criação. Carrinho, favoritos e pedidos ficam vinculados ao UID autenticado; o catálogo continua vindo do arquivo local do app.

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/), adicione um app Web e habilite **Authentication → Sign-in method → Email/Password**.
2. Crie o banco Cloud Firestore.
3. Os valores do app Web deste projeto já estão em `src/firebase/config.js`. Se trocar de projeto Firebase, atualize esse arquivo com a configuração Web do seu projeto. Essa configuração é pública no app cliente; nunca inclua chaves privadas ou arquivos de conta de serviço.
4. Publique as regras de [firestore.rules](./firestore.rules) no Firebase Console ou pela Firebase CLI. Elas só permitem que cada usuário autenticado leia e altere os próprios documentos.

O documento `usuarios/{uid}/dados/estadoCompra` guarda carrinho e favoritos. Os pedidos são criados em `usuarios/{uid}/pedidos`. Nunca use regras abertas em um app publicado nem coloque credenciais de servidor/conta de serviço no cliente.

## 6. Telas e experiência da loja

A vitrine deve apresentar a identidade visual da loja, busca, categorias e cartões com imagem, nome e preço. Ao selecionar um produto, exiba detalhes e permita adicioná-lo ao carrinho ou aos favoritos. No carrinho, permita alterar quantidades e remover itens; no checkout, apresente resumo do pedido e formulário de entrega.

Use estados visuais para carregamento, erro, lista vazia e sucesso. Evite iniciar outra consulta de CEP enquanto uma consulta estiver em andamento. Dimensione as imagens para os cartões, use placeholder/fallback para imagens ausentes e teste diferentes tamanhos de tela e orientação.

## 7. Testes

Valide estes cenários no Snack e no Expo Go:

- A vitrine carrega os produtos definidos localmente e as imagens aparecem.
- Busca e filtros funcionam sem chamadas a APIs de produtos.
- Detalhes, favoritos, quantidades e remoção de itens do carrinho funcionam.
- Cadastro cria a conta no Firebase Authentication e o perfil `usuarios/{uid}` no Firestore; login e logout funcionam.
- Um CEP válido preenche logradouro, bairro, cidade e estado.
- CEP com menos ou mais de oito dígitos é rejeitado antes da consulta.
- CEP inexistente, falha de rede e resposta inválida mostram mensagens claras.
- Número e complemento podem ser preenchidos e editados pelo comprador.
- O formulário funciona em diferentes tamanhos de tela e orientação.
- As regras do Firestore impedem acesso aos dados de outro usuário.
- Carrinho e favoritos continuam disponíveis após fechar e reabrir o app.
- Pedidos confirmados ficam salvos na coleção Firestore do usuário autenticado.
- Imagens carregam em resolução adequada ao catálogo e à tela.
- A lista renderiza itens sob demanda ao rolar a vitrine.

## 8. Entrega

Salve o projeto no Snack e compartilhe o link, conforme solicitado pela disciplina. Se também for entregar o código ZIP, inclua os arquivos do projeto e instruções para executar, sem dependências instaladas desnecessárias. Inclua os integrantes, funcionalidades implementadas, instruções de uso e evidências dos testes. Não invente resultados de performance.

Para o relatório de desempenho, execute o Lighthouse nas ferramentas do Google Chrome DevTools sobre a versão web e salve o relatório gerado como evidência. Faça a análise no dispositivo/ambiente definido pela disciplina; os resultados variam conforme aparelho, rede e build. Nenhum resultado de desempenho deve ser declarado sem medição.

## Referências

- [Expo Snack](https://snack.expo.dev/)
- [Documentação do Expo](https://docs.expo.dev/)
- [Documentação da API ViaCEP](https://viacep.com.br/)
- [Firebase para JavaScript](https://firebase.google.com/docs/web/setup)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- [Regras de segurança do Firestore](https://firebase.google.com/docs/firestore/security/get-started)
- [React Native — FlatList](https://reactnative.dev/docs/flatlist)
