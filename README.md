# Vitrine Mobile — guia para criar um app de vendas

Passo a passo para criar no **Expo Snack** um aplicativo de catálogo de produtos com **React Native**. O app consulta produtos pela API pública do [DummyJSON](https://dummyjson.com/docs/products) e usa **Firebase Cloud Firestore** para salvar favoritos e itens do carrinho.

> Personalize o nome, o visual, as categorias e o conteúdo para criar uma experiência original. Não copie a identidade de uma loja existente.

## O que será construído

- Tela inicial com busca, categorias e catálogo de produtos.
- Imagens, preços e descrições dos produtos, além de uma tela de detalhes.
- Consulta assíncrona à API DummyJSON com paginação e tratamento de erros.
- Favoritos e carrinho salvos no Cloud Firestore.
- Carregamento incremental da lista (lazy loading).
- Layout que se adapta a diferentes tamanhos de tela e à rotação.
- Imagens dimensionadas para a tela e, se houver upload, comprimidas antes do envio.
- Testes e relatório de análise de performance.

## 1. Crie o app no Expo Snack

1. Acesse [snack.expo.dev](https://snack.expo.dev/) e entre com sua conta Expo.
2. Crie um Snack novo e escolha um template React Native. O Snack já permite editar e executar o código no navegador, sem instalar Node.js no computador.
3. Renomeie o projeto e edite `App.js` ou `App.tsx`, conforme o template escolhido.
4. Use a área **Dependencies** para adicionar os pacotes necessários. Para este guia, adicione `firebase` e `expo-image` (se optar por usar essa biblioteca).
5. Abra a prévia web ou escaneie o QR code com o Expo Go. Confira as dependências e limitações atuais do Snack antes de adicionar bibliotecas: módulos nativos que exigem configuração nativa própria podem não funcionar nele.

Salve o Snack na sua conta e use a opção de compartilhar para enviar o link do projeto. Faça cópias/versões durante o desenvolvimento para não perder alterações.

## 2. Configure o Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/) e crie um projeto.
2. Adicione um app **Web** ao projeto Firebase. Copie os dados de configuração que o console fornecer.
3. No menu **Build → Authentication**, habilite o provedor **Anonymous**. Ele permite identificar cada instalação/usuário sem criar uma tela de cadastro para o protótipo.
4. No menu **Build → Firestore Database**, crie um banco Cloud Firestore. Escolha a região adequada e comece em modo de produção, configurando as regras a seguir.
5. No Snack, adicione a dependência `firebase` e configure a conexão usando o objeto de configuração do app Web.

Crie `firebase.js` (ou coloque inicialmente esse código em `App.js`) e substitua os valores pelos do seu projeto:

```js
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'SUA_API_KEY',
  authDomain: 'SEU_PROJETO.firebaseapp.com',
  projectId: 'SEU_PROJECT_ID',
  storageBucket: 'SEU_PROJETO.appspot.com',
  messagingSenderId: 'SEU_SENDER_ID',
  appId: 'SEU_APP_ID',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export async function entrarComoVisitante() {
  const credencial = await signInAnonymously(auth);
  return credencial.user.uid;
}
```

Os valores de configuração de um app Firebase Web são enviados ao cliente e não substituem regras de segurança. Proteja os dados com Authentication e regras do Firestore; nunca publique credenciais de servidor ou chaves privadas no Snack.

### Regras do Firestore

Com a autenticação anônima habilitada, uma regra pode limitar o acesso aos dados do usuário autenticado. No console, publique regras como estas e teste-as com o simulador de regras:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null
                        && request.auth.uid == userId;
    }
  }
}
```

Essa regra só permite que o usuário autenticado leia e altere documentos dentro do próprio caminho `users/{uid}`. Não use regras abertas como `allow read, write: if true` em um app compartilhado ou publicado. A autenticação anônima identifica instalações, mas não oferece recuperação de conta como um cadastro convencional.

## 3. Organize o código

Mesmo que o protótipo comece em um único arquivo no Snack, separe as responsabilidades em arquivos quando o projeto crescer. Use o menu de arquivos do Snack para adicionar módulos, se disponível no template:

```text
App.js
src/
├── components/       # Cartão de produto, busca e mensagens de estado
├── screens/          # Início, detalhes e favoritos/carrinho
├── services/         # Requisições HTTP à API
├── firebase/         # Configuração e operações do Firebase
└── types/            # Tipos, caso use TypeScript
```

Mantenha a interface, as chamadas à API e as operações do Firestore separadas. Isso facilita entender, testar e corrigir o app.

## 4. Modele os produtos e consulte a API

Crie `src/types/Product.ts` se estiver usando TypeScript:

```ts
export type Product = {
  id: number;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
  images: string[];
  category: string;
};
```

Crie `src/services/products.ts` para obter uma página de produtos. O parâmetro `skip` permite carregar mais resultados sem buscar o catálogo inteiro de uma vez:

```ts
import type { Product } from '../types/Product';

const API_URL = 'https://dummyjson.com/products';

type ProductsResponse = {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
};

export async function fetchProducts(skip = 0, limit = 20): Promise<ProductsResponse> {
  const response = await fetch(`${API_URL}?limit=${limit}&skip=${skip}`);
  if (!response.ok) {
    throw new Error(`Falha ao carregar produtos (HTTP ${response.status}).`);
  }
  return (await response.json()) as ProductsResponse;
}
```

Se o Snack estiver usando JavaScript, remova as anotações de tipo TypeScript. Consulte a documentação do DummyJSON para busca e demais parâmetros.

## 5. Salve favoritos e carrinho no Firestore

O exemplo abaixo grava um favorito no caminho do usuário autenticado. Crie funções semelhantes para remover/listar favoritos e adicionar, atualizar ou remover itens do carrinho:

```js
import { doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { db } from './firebase';

export async function salvarFavorito(uid, product) {
  const favoritoRef = doc(db, 'users', uid, 'favorites', String(product.id));
  await setDoc(favoritoRef, {
    productId: product.id,
    title: product.title,
    price: product.price,
    thumbnail: product.thumbnail,
  });
}

export async function removerFavorito(uid, productId) {
  await deleteDoc(doc(db, 'users', uid, 'favorites', String(productId)));
}

export async function listarFavoritos(uid) {
  const snapshot = await getDocs(collection(db, 'users', uid, 'favorites'));
  return snapshot.docs.map((item) => item.data());
}
```

Chame `entrarComoVisitante()` no início do app, dentro de `try/catch`, e guarde o `uid` retornado em estado. Só execute operações de favorito/carrinho depois que esse identificador estiver disponível. Trate erros de rede e de permissão do Firebase com uma mensagem e uma opção para tentar novamente.

Considere salvar no carrinho os campos necessários para exibição, como identificador, título, preço, imagem e quantidade. O catálogo pode continuar vindo da API; o Firestore guarda os dados do usuário e, se desejado, também pode ser usado como fonte de produtos cadastrados pela equipe.

## 6. Monte a tela inicial e os detalhes

A tela inicial deve apresentar o nome e a identidade visual do projeto, campo de busca, categorias e cartões de produto. Cada cartão pode mostrar imagem, título e preço. Formate o preço em reais:

```js
const precoFormatado = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(product.price);
```

Ao tocar em um produto, abra uma tela ou modal de detalhes com imagem, descrição completa, preço e botão para adicionar aos favoritos ou ao carrinho. Se usar navegação, organize as rotas Home, Detalhes e Favoritos/Carrinho. Valide o produto recebido e mostre estado de erro se os dados não estiverem disponíveis.

## 7. Trate erros, estados assíncronos e lazy loading

Mantenha estados separados para lista, carregamento, erro e paginação. Use `try/catch/finally` nas chamadas assíncronas. Mostre indicador durante o carregamento, mensagem útil se a API ou o Firebase falhar e estado vazio quando não houver resultados.

Use `FlatList` para o catálogo, em vez de uma lista longa dentro de `ScrollView`. Configure `keyExtractor` com o ID e use `onEndReached` para solicitar a página seguinte:

1. Comece com `skip = 0`.
2. Acrescente os novos produtos à lista atual.
3. Atualize `skip` com a quantidade recebida.
4. Pare quando a quantidade carregada alcançar `total`.
5. Evite iniciar várias requisições ao mesmo tempo.

Para a busca, use o endpoint de busca da API e considere um pequeno debounce. Evite que respostas antigas sobrescrevam resultados de uma busca mais recente.

## 8. Imagens e responsividade

Use imagens com tamanho definido e modo de preenchimento adequado (`cover`), placeholder e fallback para falha de carregamento. Evite baixar imagens maiores do que o necessário para o cartão. Se o app permitir escolher imagens, redimensione e comprima antes de enviar ao Firebase Storage; lembre-se de configurar regras de acesso ao Storage também.

Use `useWindowDimensions()` para acompanhar mudanças de largura e altura. Ajuste número de colunas, espaçamento e dimensões dos cartões de acordo com o espaço disponível. Teste retrato e paisagem na prévia do Snack e em um aparelho real.

## 9. Teste o aplicativo

Valide estes cenários no Snack e no Expo Go:

- A API carrega produtos e a paginação carrega mais resultados.
- Busca com resultados e sem resultados.
- Falha de rede mostra mensagem e permite tentar novamente.
- A autenticação anônima inicia e o usuário consegue salvar/remover favoritos.
- Dados de um usuário não podem ser acessados por outro, conforme as regras do Firestore.
- Erros ou falta de permissão do Firebase não encerram o app.
- Imagem ausente ou lenta não quebra o catálogo.
- Rotação e diferentes tamanhos de tela não cortam conteúdo.

## 10. Analise e registre a performance

Meça o app em aparelho/emulador representativo e registre modelo do dispositivo, versão do sistema, versão do app, condições da rede e passos usados para reproduzir o teste. Observe abertura, rolagem da lista, busca e carregamento de imagens; anote resultados, problemas e melhorias, incluindo capturas de tela ou exportação do relatório.

Para Android nativo, use o **Android Studio Profiler** para observar CPU, memória e rede. O **Lighthouse** é adequado para a versão web do Snack, mas não substitui uma análise de performance do app nativo. Inclua o relatório real da equipe; não invente métricas.

## 11. Prepare a entrega

Salve o projeto no Snack e compartilhe o link, conforme solicitado pela disciplina. Se também for entregar o código ZIP, inclua os arquivos do projeto e instruções para executar, mas não inclua dependências instaladas desnecessárias. Confira se o link do Snack está acessível para quem vai avaliar e não publique dados pessoais ou credenciais privadas.

Inclua na entrega:

- Nome completo de todos os integrantes.
- Link do Snack e instruções de uso.
- Funcionalidades implementadas, API e serviços Firebase utilizados.
- Evidências dos testes e relatório de performance.
- Arquivo ZIP, se solicitado.

## Referências

- [Expo Snack](https://snack.expo.dev/)
- [Documentação do Expo](https://docs.expo.dev/)
- [Firebase para JavaScript](https://firebase.google.com/docs/web/setup)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
- [Firebase Authentication — login anônimo](https://firebase.google.com/docs/auth/web/anonymous-auth)
- [Regras de segurança do Firestore](https://firebase.google.com/docs/firestore/security/get-started)
- [React Native — FlatList](https://reactnative.dev/docs/flatlist)
- [DummyJSON — Products API](https://dummyjson.com/docs/products)
- [Android Studio Profiler](https://developer.android.com/studio/profile)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)
