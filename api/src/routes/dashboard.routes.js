const router = require("express").Router();

const auth = require("../middlewares/auth.middleware");

router.get("/", auth, (req, res) => {

    return res.json({

        sucesso: true,

        usuario: req.usuario,

        mensagem: "Dashboard carregado."

    });

});

module.exports = router;