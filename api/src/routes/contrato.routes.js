const router = require("express").Router();

const ContratoController = require("../controllers/contrato.controller");
const auth = require("../middlewares/auth.middleware");

router.post("/", auth, ContratoController.cadastrar);

router.get("/", auth, ContratoController.listar);

router.get("/:id", auth, ContratoController.buscarPorId);

router.put("/:id", auth, ContratoController.atualizar);

router.delete("/:id", auth, ContratoController.excluir);

module.exports = router;