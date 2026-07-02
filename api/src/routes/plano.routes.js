const router = require("express").Router();

const PlanoController = require("../controllers/plano.controller");

const auth = require("../middlewares/auth.middleware");

router.post("/", auth, PlanoController.cadastrar);

router.get("/", auth, PlanoController.listar);

router.get("/:id", auth, PlanoController.buscarPorId);

router.put("/:id", auth, PlanoController.atualizar);

router.delete("/:id", auth, PlanoController.excluir);

module.exports = router;