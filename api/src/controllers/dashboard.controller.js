const DashboardService = require("../services/dashboard.service");

class DashboardController {
    async executivo(req, res) {
        try {
            const resultado = await DashboardService.executivo(req.usuario);
            return res.json(resultado);
        } catch (error) {
            return res.status(403).json({ sucesso: false, mensagem: error.message });
        }
    }

    async inadimplentes(req, res) {
        try {
            const resultado = await DashboardService.inadimplentes(req.usuario);
            return res.json(resultado);
        } catch (error) {
            return res.status(403).json({ sucesso: false, mensagem: error.message });
        }
    }
}

module.exports = new DashboardController();
