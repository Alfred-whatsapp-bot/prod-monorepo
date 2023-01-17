import { ClientePedido } from "../models/clientePedido.model.js";

export const getPedidos = async () => {
  const pedidos = await ClientePedido.findAll();
  return pedidos;
};

export const getPedidoById = async (id) => {
  const pedido = await ClientePedido.findAll({
    where: {
      pedido_id: id,
    },
  });
  return pedido;
};

export const getPedidosByClienteId = async (id) => {
  const pedidos = await ClientePedido.findAll({
    where: {
      cliente_id: id,
    },
  });
  return pedidos;
};

export const createPedido = async (pedido) => {
  const pedidoCreated = await ClientePedido.create(pedido);
  return pedidoCreated;
};
