const router = require("express").Router();

const ClienteController = require("../controllers/cliente.controller");

const auth = require("../middlewares/auth.middleware");

router.get("/", auth, ClienteController.listar);

router.get("/:id/detalhe", auth, ClienteController.detalhe);

router.get("/:id", auth, ClienteController.buscarPorId);

router.post("/", auth, ClienteController.criar);

router.put("/:id", auth, ClienteController.editar);

router.delete("/:id", auth, ClienteController.excluir);

module.exports = router;