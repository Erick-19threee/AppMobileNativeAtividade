# Vitrine Mobile — aplicativo de vendas em React Native

Guia passo a passo para criar uma vitrine de produtos inspirada em lojas on-line. A proposta usa **Expo + React Native + TypeScript**, a API pública do [DummyJSON](https://dummyjson.com/docs/products) para carregar produtos e **SQLite local** para persistir favoritos e carrinho. Assim, o projeto demonstra integração com API e banco de dados sem exigir credenciais de serviços pagos.

> Personalize nome, identidade visual, categorias e conteúdo. Não copie uma loja existente: crie uma experiência original para o trabalho.

## O que será construído

- Tela inicial com produtos, imagens, preço, busca e categorias.
- Tela de detalhes do produto.
- Favoritos e carrinho persistidos no SQLite.
- Carregamento assíncrono, paginação sob demanda e estados de carregamento/erro.
- Layout que se adapta à largura e à rotação do aparelho.
- Imagens redimensionadas/comprimidas antes de salvar conteúdo local.
- Checklist para medir e relatar a performance.

## 1. Pré-requisitos

Instale [Node.js LTS](https://nodejs.org/), Git e o aplicativo **Expo Go** no celular, ou um emulador Android/iOS. Para gerar builds nativos, instale também as ferramentas indicadas no [guia do Expo](https://docs.expo.dev/get-started/set-up-your-environment/).

Confira as instalações:

```bash
node --version
npm --version
```

## 2. Crie o projeto Expo

No terminal, a partir da pasta onde deseja desenvolver:

```bash
npx create-expo-app@latest vitrine-mobile --template blank-typescript
cd vitrine-mobile
```

Instale as dependências:

```bash
npx expo install expo-sqlite expo-image expo-image-manipulator
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
```

Inicie o servidor e leia o QR code com o Expo Go:

```bash
npx expo start
```

## 3. Organize os arquivos

Crie uma estrutura simples, separando telas, componentes, acesso a dados e modelos:

```text
vitrine-mobile/
├── App.tsx
└── src/
    ├── components/       # Cartão, busca, indicador de carregamento
    ├── database/          # Inicialização e operações SQLite
    ├── navigation/        # Rotas e tipos de navegação
    ├── screens/           # Início, detalhes e favoritos/carrinho
    ├── services/          # Cliente HTTP e chamadas à API
    └── types/             # Tipos TypeScript
```

Mantenha componentes pequenos. A tela não deve fazer diretamente consultas SQL e requisições HTTP; delegue essas tarefas a `database/` e `services/`.

## 4. Defina o tipo de produto e conecte à API

O DummyJSON oferece dados de demonstração e paginação. Crie `src/types/Product.ts`:

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

Crie `src/services/products.ts` para solicitar uma página de produtos. O parâmetro `skip` permite buscar mais itens sem carregar todo o catálogo de uma vez:

```ts
import type { Product } from '../types/Product';

const API_URL = 'https://dummyjson.com/products';

export async function fetchProducts(skip = 0, limit = 20) {
  const response = await fetch(`${API_URL}?limit=${limit}&skip=${skip}`);
  if (!response.ok) throw new Error(`Falha ao carregar produtos (${response.status})`);
  const data: { products: Product[]; total: number } = await response.json();
  return data;
}
```

Consulte a documentação da API para filtros e busca. Trate erros de rede na tela; não presuma que uma chamada sempre terá sucesso.

## 5. Inicialize o SQLite

Use `expo-sqlite` para criar tabelas locais, por exemplo, `favorites` e `cart_items`. Na inicialização do app, abra o banco e execute `CREATE TABLE IF NOT EXISTS`. Salve o identificador do produto e os campos necessários para exibi-lo offline.

Exemplo de esquema SQL:

```sql
CREATE TABLE IF NOT EXISTS favorites (
  product_id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  price REAL NOT NULL,
  thumbnail TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cart_items (
  product_id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  price REAL NOT NULL,
  thumbnail TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1
);
```

Implemente funções separadas como `addFavorite`, `removeFavorite`, `listFavorites` e `addToCart`. Use consultas parametrizadas (`?`) em vez de concatenar valores recebidos do usuário. Teste o encerramento e reabertura do aplicativo para confirmar que os dados continuam salvos.

> A API fornece o catálogo; o SQLite guarda dados do usuário neste dispositivo. Para sincronização entre aparelhos ou vários usuários, use um backend com autenticação e banco remoto (por exemplo, Firebase) e nunca coloque chaves privadas no aplicativo.

## 6. Monte a navegação e as telas

Configure uma navegação em pilha com as rotas `Home` e `ProductDetails`. Na tela inicial, faça uma requisição quando a tela for aberta e apresente:

- Título e identidade visual próprios.
- Campo de busca e categorias.
- Produtos em cartões com imagem, título e preço formatado em reais (`Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`).
- Ações para favoritar e adicionar ao carrinho.

Ao tocar em um cartão, envie o produto selecionado à tela de detalhes, que deve exibir imagem, descrição completa, preço e ação de compra/carrinho.

## 7. Implemente estados, erros e carregamento assíncrono

Na tela inicial, mantenha estados distintos para produtos, carregamento, erro e paginação. Use `try/catch/finally` ao chamar `fetchProducts`; mostre uma mensagem compreensível e um botão **Tentar novamente** quando a chamada falhar. Evite iniciar a mesma requisição repetidamente enquanto outra ainda está em andamento.

Use `FlatList` (em vez de criar uma lista longa de componentes dentro de `ScrollView`) e carregue a próxima página com `onEndReached`. A lista virtualizada renderiza itens conforme necessário — uma forma de carregamento eficiente/lazy loading. Exiba um indicador no rodapé durante a paginação e encerre quando `skip` atingir `total`.

Para a busca, use o endpoint de busca da API e considere um pequeno debounce para não enviar uma chamada a cada tecla. Cancele requisições antigas com `AbortController` ou ignore respostas obsoletas, evitando que um resultado anterior sobrescreva a busca atual.

## 8. Imagens e compressão

Use `expo-image` para exibir imagens remotas com `contentFit="cover"`, dimensões definidas e placeholder enquanto carregam. Não baixe nem salve imagens em tamanho original se uma versão menor atender à interface.

Se o usuário puder escolher/enviar uma imagem, redimensione-a antes de armazená-la ou enviá-la usando `expo-image-manipulator` (largura adequada à tela e JPEG com qualidade ajustada, por exemplo, entre `0.7` e `0.85`). Compare o tamanho antes e depois. Para fotos já hospedadas pelo DummyJSON, a compressão é responsabilidade do servidor; não há benefício em recomprimir no dispositivo apenas para exibir a imagem. Prefira thumbnails e cache.

## 9. Layout responsivo e rotação

Use `useWindowDimensions()` para obter largura/altura atualizadas quando o aparelho gira. Defina o número de colunas conforme o espaço disponível (por exemplo, uma coluna em telas estreitas e duas em telas maiores) e use `flexWrap`, espaçamentos relativos e limites de largura. Teste retrato e paisagem em pelo menos um emulador e um aparelho, verificando se texto, imagens, botões e detalhes continuam acessíveis.

## 10. Teste o aplicativo

Execute `npx expo start` e valide os seguintes cenários:

- A lista carrega e a paginação traz mais produtos.
- Busca sem resultados e busca com resultados.
- Modo avião/erro da API mostra mensagem e permite tentar novamente.
- Favoritar, remover favorito e alterar o carrinho; os dados permanecem após reiniciar.
- Imagem ausente ou lenta não quebra o cartão.
- Rotação da tela e diferentes tamanhos de aparelho.
- Não há erros ou avisos relevantes no terminal/console.

## 11. Analise e registre a performance

Faça medições em um aparelho/emulador representativo, preferencialmente em build de produção, não apenas no modo de desenvolvimento. Registre modelo do dispositivo, versão do sistema, versão do app, rede e condições do teste; faça mais de uma execução e anote os resultados e gargalos.

Para análise nativa Android, use o **Android Studio Profiler** para observar CPU, memória e rede durante a abertura, rolagem da lista e carregamento de imagens. Se também publicar uma versão web, use **Lighthouse no Chrome DevTools** e inclua o relatório da página web — Lighthouse não mede diretamente o desempenho de um app React Native nativo. Anexe capturas ou exportação do relatório e descreva pelo menos uma melhoria aplicada, como paginação, redução de imagens ou remoção de renders desnecessários.

## 12. Prepare a entrega

Antes da entrega, confira o README e o projeto, remova dados pessoais e segredos, e teste o procedimento do zero. Para compartilhar o código, compacte a pasta do projeto em `.zip` (sem `node_modules`) ou envie o projeto via Expo conforme solicitado pela disciplina. Inclua no material de entrega:

- Nome completo de cada integrante.
- Instruções para instalar e executar.
- Funcionalidades implementadas e serviços usados (API e banco).
- Evidência dos testes e relatório de performance.
- Data/prazo de entrega informado pela disciplina.

## Referências

- [Documentação do Expo](https://docs.expo.dev/)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/)
- [Expo ImageManipulator](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/)
- [React Native — FlatList](https://reactnative.dev/docs/flatlist)
- [DummyJSON — Products API](https://dummyjson.com/docs/products)
- [Android Studio Profiler](https://developer.android.com/studio/profile)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)
