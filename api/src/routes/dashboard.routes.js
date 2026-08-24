const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const DashboardController = require("../controllers/dashboard.controller");

router.get("/", auth, (req, res) => {
    return res.json({ sucesso: true, usuario: req.usuario, mensagem: "Dashboard carregado." });
});

router.get("/executivo", auth, DashboardController.executivo);
router.get("/inadimplentes", auth, DashboardController.inadimplentes);

module.exports = router;
