const router = require("express").Router();

const LanceController = require("../controllers/lance.controller");
const auth = require("../middlewares/auth.middleware");

router.get("/", auth, LanceController.listar);

router.get(
    "/contrato/:contratoId",
    auth,
    LanceController.listarPorContrato
);

router.post("/:id/aprovar", auth, LanceController.aprovar);

router.post("/:id/reprovar", auth, LanceController.reprovar);

module.exports = router;
