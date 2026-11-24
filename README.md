# Vitrine Mobile — guia para criar um app de vendas

Este README apresenta um passo a passo para desenvolver um aplicativo de catálogo de produtos com **React Native, Expo e TypeScript**. O exemplo usa a API pública do [DummyJSON](https://dummyjson.com/docs/products) para obter produtos e o **SQLite local** para salvar favoritos e itens do carrinho.

> A proposta é servir como ponto de partida para um projeto original. Personalize o nome, o visual, as categorias e as funcionalidades; não copie a identidade de uma loja existente.

## O que o app deverá ter

- Tela inicial com busca, categorias e catálogo de produtos.
- Imagens, preços e descrições dos produtos, além de uma tela de detalhes.
- API para consultar os produtos e paginação para carregar mais itens sob demanda.
- Banco SQLite local para favoritos e carrinho.
- Tratamento de carregamento, erros de rede e listas vazias.
- Layout que se adapta a diferentes tamanhos de tela e à rotação.
- Imagens dimensionadas para a tela e, se houver upload, comprimidas antes do envio.
- Testes e relatório de análise de performance.

## 1. Prepare o ambiente

Instale [Node.js LTS](https://nodejs.org/), Git e o [Expo Go](https://expo.dev/go) no celular. Também é possível executar o projeto em um emulador Android ou iOS; para builds nativos, siga os requisitos da plataforma na documentação do Expo.

Confira as instalações:

```bash
node --version
npm --version
```

## 2. Crie o projeto e instale as dependências

No terminal, navegue até a pasta onde deseja guardar o projeto e execute:

```bash
npx create-expo-app@latest vitrine-mobile --template blank-typescript
cd vitrine-mobile
```

Instale as bibliotecas usadas no exemplo:

```bash
npx expo install expo-sqlite expo-image expo-image-manipulator
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context
```

Inicie o servidor de desenvolvimento:

```bash
npx expo start
```

Leia o QR code com o Expo Go, ou escolha um emulador disponível no terminal do Expo.

## 3. Organize o código

Crie pastas para separar telas, componentes e integrações. Por exemplo:

```text
vitrine-mobile/
├── App.tsx
└── src/
    ├── components/       # Cartão de produto, busca, mensagens de estado
    ├── database/         # Inicialização e operações SQLite
    ├── navigation/       # Rotas e tipos da navegação
    ├── screens/          # Início, detalhes e favoritos/carrinho
    ├── services/         # Requisições HTTP à API
    └── types/            # Tipos TypeScript compartilhados
```

Mantenha as telas focadas na interface. Deixe requisições HTTP em `services/` e consultas ao banco em `database/`; isso facilita testar e manter o aplicativo.

## 4. Modele os produtos

Crie `src/types/Product.ts` com os campos necessários para exibir um produto:

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

A API também pode retornar campos adicionais. Consulte a documentação do DummyJSON e ajuste o tipo à resposta que realmente for utilizada.

## 5. Consulte a API de forma assíncrona

Crie `src/services/products.ts`. O exemplo abaixo busca uma página de produtos e verifica erros HTTP antes de interpretar a resposta:

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
    throw new Error(`Não foi possível carregar os produtos (HTTP ${response.status}).`);
  }

  return (await response.json()) as ProductsResponse;
}
```

Na tela, chame essa função com `async/await` dentro de `try/catch/finally`. Guarde o resultado em estado e apresente uma mensagem compreensível quando a rede falhar, com uma ação para tentar novamente. Não deixe a tela em carregamento infinito.

Para a busca, consulte o endpoint de busca descrito na documentação da API. Considere debounce para evitar uma requisição a cada tecla e evite aplicar respostas antigas depois que o usuário já iniciou uma busca nova.

## 6. Crie a base SQLite

O catálogo vem da API; o SQLite pode guardar dados locais do usuário, como favoritos e carrinho. Inicialize o banco uma vez durante a preparação do app e crie as tabelas com `CREATE TABLE IF NOT EXISTS`.

Exemplo de esquema:

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

Implemente operações separadas, por exemplo `addFavorite`, `removeFavorite`, `listFavorites` e `addToCart`. Use consultas parametrizadas (`?`) em vez de concatenar dados em SQL. Consulte a documentação da versão instalada do `expo-sqlite` para a API assíncrona e valide o comportamento no dispositivo/emulador.

> Esse banco é local ao aparelho. Para sincronizar contas ou dados entre dispositivos, será necessário um backend e um banco remoto; não coloque credenciais privadas no aplicativo.

## 7. Monte a navegação e as telas

Configure o `NavigationContainer` e um navegador em pilha com pelo menos estas rotas:

- **Home**: busca, categorias e lista de produtos.
- **ProductDetails**: imagem, descrição completa, preço e ação para adicionar ao carrinho.
- **Favorites/Cart**: opcional, para consultar e alterar os itens salvos.

Na tela inicial, carregue os produtos ao entrar, mostre um indicador durante a requisição e apresente cartões com imagem, título e preço. Formate valores em reais:

```ts
const priceLabel = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(product.price);
```

Ao tocar em um cartão, navegue para os detalhes passando o produto selecionado ou seu identificador. Se passar apenas o identificador, carregue os detalhes correspondentes e trate o caso em que o produto não existe.

## 8. Trate estados, erros e carregamento sob demanda

Mantenha estados distintos para produtos, carregamento inicial, carregamento de próxima página e erro. Mostre também uma mensagem útil quando a API retornar uma lista vazia.

Use `FlatList` para o catálogo, em vez de renderizar uma lista longa dentro de `ScrollView`. A `FlatList` virtualiza os itens e permite buscar mais dados quando o usuário se aproxima do fim usando `onEndReached`:

1. Inicie a busca com `skip = 0`.
2. Acrescente os novos produtos à lista existente.
3. Incremente `skip` pelo número de itens recebidos.
4. Pare quando a quantidade carregada alcançar `total`.
5. Evite iniciar duas paginações ao mesmo tempo.

Isso reduz o trabalho inicial e implementa carregamento incremental (lazy loading) para o catálogo. Defina `keyExtractor` com o ID do produto e ajuste `onEndReachedThreshold` depois de testar em um aparelho real.

## 9. Exiba e otimize imagens

Use `expo-image` para mostrar imagens remotas com dimensões definidas, `contentFit="cover"` e um placeholder. Inclua fallback para URL ausente ou imagem que falhou ao carregar, para que um erro de imagem não quebre o cartão.

Evite armazenar imagens originais grandes sem necessidade. Se o app permitir escolher uma imagem, redimensione-a com `expo-image-manipulator` antes de salvar ou enviar, escolhendo dimensões compatíveis com o uso e um nível de qualidade adequado. A compressão é mais útil quando o app manipula imagens fornecidas pelo usuário; para imagens remotas do catálogo, prefira carregar uma resolução compatível com o espaço exibido.

## 10. Adapte o layout à rotação

Use `useWindowDimensions()` para acompanhar mudanças de largura e altura quando a orientação muda. Com base na largura disponível, ajuste o número de colunas do catálogo, espaçamentos e tamanhos dos cartões. Garanta que textos, botões e imagens continuem acessíveis em telas estreitas e largas.

Teste retrato e paisagem em pelo menos um emulador ou dispositivo. Evite fixar larguras absolutas para todos os componentes.

## 11. Teste os principais cenários

Execute `npx expo start` e valide manualmente:

- A API carrega produtos e a paginação traz mais itens.
- Busca com resultados e busca sem resultados.
- Falha de rede/modo avião mostra erro e permite tentar novamente.
- Favoritos e carrinho podem ser adicionados, removidos e persistem após reiniciar.
- Imagem ausente ou lenta não impede o uso do catálogo.
- Rotação e diferentes tamanhos de tela não cortam conteúdo.
- Não há erros ou avisos relevantes no terminal ou no console do dispositivo.

## 12. Analise a performance e registre os resultados

Faça medições em um dispositivo/emulador representativo e informe se o teste foi feito em modo de desenvolvimento ou build de produção. Para cada execução, anote:

- Modelo do dispositivo/emulador e versão do sistema operacional.
- Versão do app e condições da rede.
- Como reproduzir o teste (abertura, rolagem, busca ou carregamento de imagens).
- Métricas observadas, problemas encontrados e melhorias realizadas.
- Capturas de tela ou exportação do relatório como evidência.

Para Android, use o **Android Studio Profiler** para observar CPU, memória e rede durante a abertura e a rolagem. Se o projeto também tiver uma versão web publicada, o **Lighthouse** pode complementar a análise dessa versão; ele não substitui a medição do app nativo. Inclua o relatório real obtido pela equipe na entrega — não invente métricas.

## 13. Prepare a entrega

Antes de entregar, teste o projeto a partir de uma instalação limpa, remova dados pessoais e segredos e confira se as instruções funcionam. Para gerar um ZIP, não inclua `node_modules`; o avaliador pode restaurar dependências com `npm install`.

Inclua na documentação/entrega:

- Nome completo de todos os integrantes.
- Como instalar e executar o app.
- Funcionalidades implementadas, API e banco utilizados.
- Evidências dos testes e relatório de performance.
- O arquivo ZIP ou as instruções de acesso ao projeto Expo, conforme solicitado pela disciplina.

## Referências

- [Documentação do Expo](https://docs.expo.dev/)
- [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Expo Image](https://docs.expo.dev/versions/latest/sdk/image/)
- [Expo ImageManipulator](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/)
- [React Native — FlatList](https://reactnative.dev/docs/flatlist)
- [DummyJSON — Products API](https://dummyjson.com/docs/products)
- [Android Studio Profiler](https://developer.android.com/studio/profile)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)
