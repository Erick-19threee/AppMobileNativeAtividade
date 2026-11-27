import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import BotaoIcone from './IconButton';
import { cores } from '../theme';
import { formatarPreco } from '../utils/formatPrice';

export default function CartaoProduto({
  produto,
  largura,
  favorito,
  aoAlternarFavorito,
  aoAbrir,
}) {
  return (
    <Pressable onPress={aoAbrir} style={[estilos.card, { width: largura }]} accessibilityRole="button">
      <View style={estilos.imageWrap}>
        <Image source={{ uri: produto.imagem }} style={estilos.image} resizeMode="cover" />
        <BotaoIcone
          rotulo={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          ativo={favorito}
          aoPressionar={() => aoAlternarFavorito(produto.id)}
        >
          {favorito ? '♥' : '♡'}
        </BotaoIcone>
      </View>
      <Text style={estilos.category}>{produto.categoria}</Text>
      <Text style={estilos.name} numberOfLines={2}>{produto.nome}</Text>
      <Text style={estilos.price}>{formatarPreco(produto.preco)}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  card: { marginBottom: 22 },
  imageWrap: {
    height: 180,
    borderRadius: 16,
    backgroundColor: cores.border,
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  category: {
    color: cores.muted,
    fontSize: 11,
    marginTop: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  name: { color: cores.ink, fontSize: 15, fontWeight: '700', marginTop: 3, minHeight: 38 },
  price: { color: cores.orange, fontSize: 15, fontWeight: '800', marginTop: 2 },
});
