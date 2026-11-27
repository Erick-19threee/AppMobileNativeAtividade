import React from 'react';
import {
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import EstadoVazio from '../components/EmptyState';
import { cores } from '../theme';
import { formatarPreco } from '../utils/formatPrice';

function CabecalhoPagina({ titulo, informacaoExtra, aoVoltar }) {
  return (
    <View style={estilos.pageHeader}>
      <Pressable onPress={aoVoltar} style={estilos.backButton}>
        <Text style={estilos.backText}>‹</Text>
      </Pressable>
      <Text style={estilos.pageTitle}>{titulo}</Text>
      {informacaoExtra ? <Text style={estilos.pageTrailing}>{informacaoExtra}</Text> : <View style={estilos.trailingSpacer} />}
    </View>
  );
}

export default function TelaCarrinho({ carrinho, aoAlterarQuantidade, aoRemoverItem, aoContinuar, aoVoltar }) {
  const valorTotal = carrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
  const quantidadeItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);

  return (
    <SafeAreaView style={estilos.screen}>
      <CabecalhoPagina titulo="Carrinho" informacaoExtra={`${quantidadeItens} itens`} aoVoltar={aoVoltar} />
      {carrinho.length ? (
        <>
          <FlatList
            data={carrinho}
            keyExtractor={(item) => item.id}
            contentContainerStyle={estilos.list}
            renderItem={({ item }) => (
              <View style={estilos.item}>
                <Image source={{ uri: item.imagem }} style={estilos.image} />
                <View style={estilos.itemInfo}>
                  <Text style={estilos.itemName}>{item.nome}</Text>
                  <Text style={estilos.itemPrice}>{formatarPreco(item.preco)}</Text>
                  <View style={estilos.quantityRow}>
                    <Pressable
                      onPress={() => aoAlterarQuantidade(item.id, -1)}
                      style={estilos.quantityButton}
                    >
                      <Text style={estilos.quantityText}>−</Text>
                    </Pressable>
                    <Text style={estilos.quantityValue}>{item.quantidade}</Text>
                    <Pressable
                      onPress={() => aoAlterarQuantidade(item.id, 1)}
                      style={estilos.quantityButton}
                    >
                      <Text style={estilos.quantityText}>+</Text>
                    </Pressable>
                  </View>
                </View>
                <Pressable onPress={() => aoRemoverItem(item.id)} accessibilityRole="button">
                  <Text style={estilos.remove}>Remover</Text>
                </Pressable>
              </View>
            )}
          />
          <View style={estilos.footer}>
            <View style={estilos.totalRow}>
              <Text style={estilos.totalLabel}>Total</Text>
              <Text style={estilos.totalValue}>{formatarPreco(valorTotal)}</Text>
            </View>
            <Pressable onPress={aoContinuar} style={estilos.primaryButton}>
              <Text style={estilos.primaryButtonText}>Ir para entrega</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <EstadoVazio
          icone="Bag"
          titulo="Seu carrinho está vazio"
          mensagem="Adicione um objeto favorito à sua compra."
          rotuloAcao="Ver produtos"
          aoAcionar={aoVoltar}
        />
      )}
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  screen: { flex: 1, backgroundColor: cores.cream },
  pageHeader: {
    height: 68,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: cores.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.white,
  },
  backText: { fontSize: 31, lineHeight: 34, color: cores.ink },
  pageTitle: { color: cores.ink, fontSize: 18, fontWeight: '800' },
  pageTrailing: { color: cores.muted, fontSize: 12 },
  trailingSpacer: { width: 40 },
  list: { padding: 16 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: cores.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  image: { width: 82, height: 82, borderRadius: 12, backgroundColor: cores.border },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { color: cores.ink, fontSize: 15, fontWeight: '800' },
  itemPrice: { color: cores.orange, fontSize: 14, fontWeight: '800', marginTop: 3 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: cores.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: { color: cores.ink, fontSize: 16, fontWeight: '700' },
  quantityValue: { width: 32, textAlign: 'center', color: cores.ink, fontWeight: '700' },
  remove: { color: cores.muted, fontSize: 11, textDecorationLine: 'underline' },
  footer: {
    backgroundColor: cores.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: cores.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: { color: cores.ink, fontSize: 16, fontWeight: '700' },
  totalValue: { color: cores.ink, fontSize: 22, fontWeight: '800' },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: cores.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: cores.white, fontSize: 15, fontWeight: '800' },
});
