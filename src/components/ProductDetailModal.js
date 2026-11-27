import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BotaoIcone from './IconButton';
import { cores } from '../theme';
import { formatarPreco } from '../utils/formatPrice';

export default function ModalDetalheProduto({
  produto,
  visivel,
  favorito,
  aoFechar,
  aoAlternarFavorito,
  aoAdicionarAoCarrinho,
}) {
  if (!produto) return null;

  return (
    <Modal visible={visivel} animationType="slide" onRequestClose={aoFechar}>
      <SafeAreaView style={estilos.safe}>
        <ScrollView contentContainerStyle={estilos.scroll}>
          <View style={estilos.imageWrap}>
            <Image source={{ uri: produto.imagem }} style={estilos.image} resizeMode="cover" />
            <Pressable onPress={aoFechar} style={estilos.closeButton}>
              <Text style={estilos.closeText}>×</Text>
            </Pressable>
            <BotaoIcone
              rotulo={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              ativo={favorito}
              aoPressionar={() => aoAlternarFavorito(produto.id)}
            >
              {favorito ? '♥' : '♡'}
            </BotaoIcone>
          </View>
          <View style={estilos.body}>
            <Text style={estilos.category}>{produto.categoria}</Text>
            <Text style={estilos.title}>{produto.nome}</Text>
            <Text style={estilos.price}>{formatarPreco(produto.preco)}</Text>
            <View style={estilos.divider} />
            <Text style={estilos.label}>Descrição</Text>
            <Text style={estilos.description}>{produto.descricao}</Text>
            <View style={estilos.features}>
              <View style={estilos.feature}>
                <Text style={estilos.featureTitle}>Entrega</Text>
                <Text style={estilos.featureText}>Em até 5 dias úteis</Text>
              </View>
              <View style={estilos.feature}>
                <Text style={estilos.featureTitle}>Troca grátis</Text>
                <Text style={estilos.featureText}>Até 30 dias</Text>
              </View>
            </View>
          </View>
        </ScrollView>
        <View style={estilos.footer}>
          <Pressable onPress={() => aoAdicionarAoCarrinho(produto)} style={estilos.primaryButton}>
            <Text style={estilos.primaryButtonText}>Adicionar ao carrinho</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  safe: { flex: 1, backgroundColor: cores.white },
  scroll: { paddingBottom: 100 },
  imageWrap: { height: 390, backgroundColor: cores.border },
  image: { width: '100%', height: '100%' },
  closeButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 28, lineHeight: 30, color: cores.ink },
  body: { paddingHorizontal: 24, paddingTop: 24 },
  category: {
    color: cores.orange,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: { color: cores.ink, fontSize: 30, fontWeight: '800', letterSpacing: -0.8, marginTop: 5 },
  price: { color: cores.orange, fontSize: 22, fontWeight: '800', marginTop: 10 },
  divider: { height: 1, backgroundColor: cores.border, marginVertical: 22 },
  label: { color: cores.ink, fontSize: 14, fontWeight: '800', marginBottom: 8 },
  description: { color: cores.muted, fontSize: 15, lineHeight: 23 },
  features: { flexDirection: 'row', marginTop: 24, gap: 10 },
  feature: { flex: 1, backgroundColor: cores.cream, borderRadius: 12, padding: 14 },
  featureTitle: { color: cores.ink, fontSize: 13, fontWeight: '800' },
  featureText: { color: cores.muted, fontSize: 12, marginTop: 4 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: cores.border,
  },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: cores.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: cores.white, fontSize: 15, fontWeight: '800' },
});
