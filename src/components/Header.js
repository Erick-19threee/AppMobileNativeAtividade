import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { cores } from '../theme';

export default function Cabecalho({ subtitulo, quantidadeNoCarrinho, aoAbrirCarrinho }) {
  return (
    <View style={estilos.header}>
      <View>
        <Text style={estilos.brand}>nordica.</Text>
        {subtitulo ? <Text style={estilos.subtitle}>{subtitulo}</Text> : null}
      </View>
      {aoAbrirCarrinho ? (
        <Pressable
          onPress={aoAbrirCarrinho}
          style={estilos.cartButton}
          accessibilityRole="button"
          accessibilityLabel="Abrir carrinho"
        >
          <Text style={estilos.cartGlyph}>Bag</Text>
          {quantidadeNoCarrinho > 0 ? (
            <View style={estilos.badge}>
              <Text style={estilos.badgeText}>{quantidadeNoCarrinho}</Text>
            </View>
          ) : null}
        </Pressable>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  header: {
    height: 82,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: { color: cores.ink, fontSize: 25, fontWeight: '800', letterSpacing: -1 },
  subtitle: { color: cores.muted, fontSize: 12, marginTop: 2 },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: cores.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: cores.border,
  },
  cartGlyph: { fontSize: 11, fontWeight: '700', color: cores.ink },
  badge: {
    position: 'absolute',
    right: -3,
    top: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: cores.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: cores.white, fontSize: 10, fontWeight: '800' },
});
