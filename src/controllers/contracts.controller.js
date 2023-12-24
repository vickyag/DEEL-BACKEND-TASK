const { Op } = require("sequelize");
const Contract = require("../models/contract");

const getContractsById = async (req, res) => {
    const { id, type } = req.profile;
    if (id != req.params.id) return res.status(403).json({ error: 'Does not have access to view these contracts' });
    let filter;
    if (type === 'contractor') {
        filter = {
            ContractorId: id,
        };
    } else if (type === 'client') {
        filter = {
            ClientId: id
        };
    }
    const contracts = await Contract.findAll({
        where: filter
    });
    if (contracts.length === 0) return res.status(404).json({ error: 'Contracts not found' });
    res.json(contracts);
};

const getContracts = async (req, res) => {
    const { id, type } = req.profile;
    let filter;
    if (type === 'contractor') {
        filter = {
            ContractorId: id,
            status: { [Op.ne]: 'terminated' }
        };
    } else if (type === 'client') {
        filter = {
            ClientId: id,
            status: { [Op.ne]: 'terminated' }
        };
    }
    const contracts = await Contract.findAll({
        where: filter
    });
    if (contracts.length === 0) return res.status(404).json({ error: 'Contracts not found' });
    res.json(contracts);
};

module.exports = {
    getContractsById,
    getContracts,
};
