import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import TelaCarrinho from './src/screens/CartScreen';
import TelaFinalizacao from './src/screens/CheckoutScreen';
import TelaVitrine from './src/screens/StoreScreen';
import TelaAutenticacao from './src/screens/AuthScreen';
import ModalDetalheProduto from './src/components/ProductDetailModal';
import {
  cadastrarUsuarioFirebase,
  carregarEstadoCompraFirebase,
  entrarUsuarioFirebase,
  garantirPerfilUsuarioFirebase,
  inicializarFirebase,
  observarAutenticacaoFirebase,
  registrarPedidoFirebase,
  sairUsuarioFirebase,
  salvarEstadoCompraFirebase,
} from './src/firebase/loja';
import { formatarErroFirebase } from './src/firebase/erros';
import { cores } from './src/theme';

export default function Aplicativo() {
  const [telaAtual, definirTelaAtual] = useState('vitrine');
  const [usuario, definirUsuario] = useState(null);
  const [favoritos, definirFavoritos] = useState([]);
  const [carrinho, definirCarrinho] = useState([]);
  const [produtoSelecionado, definirProdutoSelecionado] = useState(null);
  const [detalheVisivel, definirDetalheVisivel] = useState(false);
  const [autenticacaoCarregada, definirAutenticacaoCarregada] = useState(false);
  const [dadosCarregados, definirDadosCarregados] = useState(false);
  const [erroFirebase, definirErroFirebase] = useState('');

  useEffect(() => {
    let componenteAtivo = true;
    let cancelarObservador;
    let numeroCarregamento = 0;

    async function iniciarFirebase() {
      try {
        await inicializarFirebase();
        cancelarObservador = observarAutenticacaoFirebase(async (usuarioFirebase) => {
          if (!componenteAtivo) return;
          const carregamentoAtual = ++numeroCarregamento;
          definirAutenticacaoCarregada(true);
          definirErroFirebase('');

          if (!usuarioFirebase) {
            definirUsuario(null);
            definirCarrinho([]);
            definirFavoritos([]);
            definirDadosCarregados(false);
            return;
          }

          if (usuarioFirebase.isAnonymous) {
            sairUsuarioFirebase().catch((erro) => {
              if (componenteAtivo) {
                definirErroFirebase(formatarErroFirebase(erro));
              }
            });
            return;
          }

          definirUsuario({
            uid: usuarioFirebase.uid,
            nome: usuarioFirebase.displayName || usuarioFirebase.email || 'Cliente',
            email: usuarioFirebase.email || '',
          });
          definirDadosCarregados(false);

          try {
            await garantirPerfilUsuarioFirebase(usuarioFirebase);
            const estadoCompra = await carregarEstadoCompraFirebase(usuarioFirebase.uid);
            if (!componenteAtivo || carregamentoAtual !== numeroCarregamento) return;
            definirCarrinho(estadoCompra.carrinho);
            definirFavoritos(estadoCompra.favoritos);
          } catch (erro) {
            if (componenteAtivo && carregamentoAtual === numeroCarregamento) {
              definirErroFirebase(formatarErroFirebase(erro));
            }
          } finally {
            if (componenteAtivo && carregamentoAtual === numeroCarregamento) {
              definirDadosCarregados(true);
            }
          }
        });
      } catch (erro) {
        if (componenteAtivo) {
          definirErroFirebase(formatarErroFirebase(erro));
          definirAutenticacaoCarregada(true);
        }
      }
    }

    iniciarFirebase();
    return () => {
      componenteAtivo = false;
      numeroCarregamento += 1;
      cancelarObservador?.();
    };
  }, []);

  useEffect(() => {
    if (!usuario || !dadosCarregados || erroFirebase) return;

    salvarEstadoCompraFirebase(usuario.uid, { carrinho, favoritos }).catch((erro) => {
      definirErroFirebase(formatarErroFirebase(erro));
    });
  }, [carrinho, dadosCarregados, erroFirebase, favoritos, usuario]);

  const quantidadeNoCarrinho = carrinho.reduce(
    (soma, item) => soma + item.quantidade,
    0
  );

  const alternarFavorito = (idProduto) => {
    definirFavoritos((atuais) =>
      atuais.includes(idProduto)
        ? atuais.filter((id) => id !== idProduto)
        : [...atuais, idProduto]
    );
  };

  const adicionarAoCarrinho = (produto) => {
    definirCarrinho((atual) => {
      const itemExistente = atual.find((item) => item.id === produto.id);
      if (itemExistente) {
        return atual.map((item) =>
          item.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [...atual, { ...produto, quantidade: 1 }];
    });
    definirDetalheVisivel(false);
  };

  const alterarQuantidade = (idProduto, variacao) => {
    definirCarrinho((atual) =>
      atual
        .map((item) =>
          item.id === idProduto
            ? { ...item, quantidade: item.quantidade + variacao }
            : item
        )
        .filter((item) => item.quantidade > 0)
    );
  };

  const confirmarPedido = async (enderecoEntrega) => {
    try {
      await registrarPedidoFirebase(usuario.uid, carrinho, enderecoEntrega);
      Alert.alert('Pedido confirmado', 'Seu pedido foi registrado e logo seguirá para entrega.');
      definirCarrinho([]);
      definirTelaAtual('vitrine');
    } catch (erro) {
      definirErroFirebase(formatarErroFirebase(erro));
    }
  };

  const encerrarSessao = async () => {
    try {
      await sairUsuarioFirebase();
    } catch (erro) {
      definirErroFirebase(formatarErroFirebase(erro));
    }
  };

  if (!autenticacaoCarregada || (usuario && !dadosCarregados)) {
    return (
      <SafeAreaView style={estilos.carregamento}>
        <ActivityIndicator size="large" color={cores.orange} />
        <Text style={estilos.textoCarregamento}>Carregando sua conta...</Text>
      </SafeAreaView>
    );
  }

  if (!usuario) {
    return (
      <TelaAutenticacao
        erroInicial={erroFirebase}
        aoEntrar={entrarUsuarioFirebase}
        aoCadastrar={cadastrarUsuarioFirebase}
      />
    );
  }

  return (
    <SafeAreaView style={estilos.aplicativo}>
      <StatusBar barStyle="dark-content" backgroundColor={cores.cream} />
      <View style={estilos.conteudo}>
        <View style={estilos.barUsuario}>
          <Text style={estilos.textoUsuario} numberOfLines={1}>
            Olá, {usuario.nome}
          </Text>
          <Pressable onPress={encerrarSessao} accessibilityRole="button">
            <Text style={estilos.textoSair}>Sair</Text>
          </Pressable>
        </View>
        {telaAtual === 'vitrine' ? (
          <TelaVitrine
            favoritos={favoritos}
            quantidadeNoCarrinho={quantidadeNoCarrinho}
            aoAlternarFavorito={alternarFavorito}
            aoAbrirProduto={(produto) => {
              definirProdutoSelecionado(produto);
              definirDetalheVisivel(true);
            }}
            aoAbrirCarrinho={() => definirTelaAtual('carrinho')}
          />
        ) : telaAtual === 'carrinho' ? (
          <TelaCarrinho
            carrinho={carrinho}
            aoAlterarQuantidade={alterarQuantidade}
            aoRemoverItem={(idProduto) =>
              definirCarrinho((atual) =>
                atual.filter((item) => item.id !== idProduto)
              )
            }
            aoContinuar={() => definirTelaAtual('finalizacao')}
            aoVoltar={() => definirTelaAtual('vitrine')}
          />
        ) : (
          <TelaFinalizacao
            carrinho={carrinho}
            aoVoltar={() => definirTelaAtual('carrinho')}
            aoConfirmarPedido={confirmarPedido}
          />
        )}
        <ModalDetalheProduto
          produto={produtoSelecionado}
          visivel={detalheVisivel}
          favorito={produtoSelecionado
            ? favoritos.includes(produtoSelecionado.id)
            : false}
          aoFechar={() => definirDetalheVisivel(false)}
          aoAlternarFavorito={alternarFavorito}
          aoAdicionarAoCarrinho={adicionarAoCarrinho}
        />
        {erroFirebase ? (
          <View style={estilos.avisoErro}>
            <Text style={estilos.textoErro}>
              Firebase: {formatarErroFirebase(new Error(erroFirebase))}
            </Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  aplicativo: { flex: 1, backgroundColor: cores.cream },
  conteudo: { flex: 1 },
  carregamento: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.cream,
  },
  textoCarregamento: { color: cores.ink, marginTop: 12 },
  barUsuario: {
    minHeight: 40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: cores.cream,
  },
  textoUsuario: { color: cores.ink, fontSize: 12, fontWeight: '700', flex: 1 },
  textoSair: { color: cores.green, fontSize: 12, fontWeight: '800', padding: 8 },
  avisoErro: {
    padding: 10,
    backgroundColor: '#FFF0EC',
    borderTopWidth: 1,
    borderTopColor: '#E8B3A5',
  },
  textoErro: { color: '#A33A20', fontSize: 12 },
});
