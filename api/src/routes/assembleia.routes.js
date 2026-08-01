const router = require("express").Router();

const AssembleiaController = require("../controllers/assembleia.controller");
const auth = require("../middlewares/auth.middleware");

router.post("/", auth, AssembleiaController.cadastrar);

router.get("/", auth, AssembleiaController.listar);

router.patch("/:id/abrir-lances", auth, AssembleiaController.abrirLances);

router.patch("/:id/encerrar", auth, AssembleiaController.encerrar);

router.get("/:id/analise", auth, AssembleiaController.analisar);

router.post(
    "/:id/contemplar/:lanceId",
    auth,
    AssembleiaController.contemplar
);

router.post(
    "/:id/contemplar-maior-lance",
    auth,
    AssembleiaController.contemplarMaior
);

module.exports = router;
