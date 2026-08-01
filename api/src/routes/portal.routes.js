const router = require("express").Router();

const PortalController = require("../controllers/portal.controller");

const auth = require("../middlewares/auth.middleware");

router.get(
    "/contrato",
    auth,
    PortalController.contrato
);

router.get(
    "/parcelas",
    auth,
    PortalController.parcelas
);
router.get("/dashboard", auth, PortalController.dashboard);

router.get("/contratos", auth, PortalController.contratos);

router.get("/lances/situacao", auth, PortalController.situacaoLance);

router.post("/lances", auth, PortalController.registrarLance);

module.exports = router;