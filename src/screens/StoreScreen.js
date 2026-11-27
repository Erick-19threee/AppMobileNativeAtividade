import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import EstadoVazio from '../components/EmptyState';
import Cabecalho from '../components/Header';
import CartaoProduto from '../components/ProductCard';
import { produtos } from '../data/products';
import { cores } from '../theme';

export default function TelaVitrine({
  favoritos,
  quantidadeNoCarrinho,
  aoAlternarFavorito,
  aoAbrirProduto,
  aoAbrirCarrinho,
}) {
  const [busca, definirBusca] = useState('');
  const [categoriaSelecionada, definirCategoriaSelecionada] = useState('Todos');
  const { width: larguraTela } = useWindowDimensions();
  const quantidadeColunas = larguraTela >= 900 ? 4 : larguraTela >= 600 ? 3 : 2;
  const larguraCartao = (larguraTela - 48 - (quantidadeColunas - 1) * 12) / quantidadeColunas;
  const categorias = ['Todos', ...new Set(produtos.map((produto) => produto.categoria))];

  const produtosFiltrados = useMemo(() => {
    const termoBusca = busca.trim().toLowerCase();
    return produtos.filter((produto) => {
      const correspondeCategoria =
        categoriaSelecionada === 'Todos' || produto.categoria === categoriaSelecionada;
      const correspondeBusca =
        !termoBusca ||
        produto.nome.toLowerCase().includes(termoBusca) ||
        produto.descricao.toLowerCase().includes(termoBusca);
      return correspondeCategoria && correspondeBusca;
    });
  }, [busca, categoriaSelecionada]);

  return (
    <View style={estilos.screen}>
      <Cabecalho
        subtitulo="Objetos para viver melhor"
        quantidadeNoCarrinho={quantidadeNoCarrinho}
        aoAbrirCarrinho={aoAbrirCarrinho}
      />
      <View style={estilos.searchWrap}>
        <Text style={estilos.searchIcon}>⌕</Text>
        <TextInput
          value={busca}
          onChangeText={definirBusca}
          placeholder="Buscar na loja"
          placeholderTextColor="#99958C"
          style={estilos.searchInput}
          returnKeyType="search"
        />
        {busca ? (
          <Pressable onPress={() => definirBusca('')} accessibilityRole="button">
            <Text style={estilos.clearSearch}>×</Text>
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.categories}>
        {categorias.map((categoria) => (
          <Pressable
            key={categoria}
            onPress={() => definirCategoriaSelecionada(categoria)}
            style={[
              estilos.categoryChip,
              categoriaSelecionada === categoria && estilos.categoryChipActive,
            ]}
          >
            <Text
              style={[
                estilos.categoryChipText,
                categoriaSelecionada === categoria && estilos.categoryChipTextActive,
              ]}
            >
              {categoria}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {produtosFiltrados.length ? (
        <FlatList
          data={produtosFiltrados}
          key={`colunas-${quantidadeColunas}`}
          keyExtractor={(produto) => produto.id}
          numColumns={quantidadeColunas}
          columnWrapperStyle={quantidadeColunas > 1 ? estilos.column : undefined}
          contentContainerStyle={estilos.productList}
          showsVerticalScrollIndicator={false}
          initialNumToRender={4}
          windowSize={5}
          maxToRenderPerBatch={4}
          renderItem={({ item: produto }) => (
            <CartaoProduto
              produto={produto}
              largura={larguraCartao}
              favorito={favoritos.includes(produto.id)}
              aoAlternarFavorito={aoAlternarFavorito}
              aoAbrir={() => aoAbrirProduto(produto)}
            />
          )}
        />
      ) : (
        <EstadoVazio
          icone="⌕"
          titulo="Nada por aqui"
          mensagem="Tente outro nome ou categoria."
        />
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  screen: { flex: 1, backgroundColor: cores.cream, paddingHorizontal: 24 },
  searchWrap: {
    height: 50,
    borderRadius: 14,
    backgroundColor: cores.white,
    borderWidth: 1,
    borderColor: cores.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  searchIcon: { color: cores.muted, fontSize: 22, marginRight: 8 },
  searchInput: { flex: 1, height: '100%', color: cores.ink, fontSize: 15 },
  clearSearch: { color: cores.muted, fontSize: 24, paddingHorizontal: 4 },
  categories: { flexGrow: 0, marginVertical: 14 },
  categoryChip: {
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: cores.border,
    paddingHorizontal: 16,
    marginRight: 8,
    justifyContent: 'center',
    backgroundColor: cores.white,
  },
  categoryChipActive: { backgroundColor: cores.ink, borderColor: cores.ink },
  categoryChipText: { color: cores.ink, fontSize: 13, fontWeight: '600' },
  categoryChipTextActive: { color: cores.white },
  productList: { paddingBottom: 30 },
  column: { justifyContent: 'space-between' },
});
