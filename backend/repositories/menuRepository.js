import { Produtos } from "../model/produtos.model.cjs";

export const getAllProdutos = async () => {
  const produtos = await Produtos.findAll({
    where: {
      ativo: true,
    },
  });
  return produtos.map((produto) => produto.toJSON());
};

export const getProdutoById = async (id) => {
  const produto = await Produtos.findAll({
    where: {
      ativo: true,
      produto_id: id,
    },
  });
  return produto.map((produto) => produto.toJSON());
};

export const getProdutosByCategory = async (category) => {
  const produtos = await Produtos.findAll({
    where: {
      ativo: true,
      categoria: category,
    },
  });
  return produtos.map((produto) => produto.toJSON());
};

export const getProdutoByName = async (name) => {
  const produto = await Produtos.findAll({
    where: {
      ativo: true,
      nome: name,
    },
  });
  return produto.map((produto) => produto.toJSON());
};

export const createProduto = async (produto) => {
  const produtoCreated = await Produtos.create(produto);
  return produtoCreated._modelOptions.instance.toJSON();
};

export const updateProduto = async (produto) => {
  const produtoUpdated = await Produtos.update(produto, {
    where: {
      produto_id: produto.produto_id,
    },
  });
  return produtoUpdated[0];
};

export const deleteProduto = async (id) => {
  const produtoDeleted = await Produtos.destroy({
    where: {
      produto_id: id,
    },
  });
  return produtoDeleted;
};

export const getAllCategorias = async () => {
  const categorias = await Produtos.findAll({
    attributes: ["categoria"],
    group: ["categoria"],

    where: {
      ativo: true,
    },
  });
  return categorias.map((categoria) => categoria.toJSON());
};
